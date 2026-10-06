import { randomUUID } from "node:crypto";

import { ObjectId } from "mongodb";
import { SOURCE_APPRENANT, STATUT_APPRENANT } from "shared/constants";
import { IEffectif, IMissionLocaleEffectif, IOrganisationOrganismeFormation, SITUATION_ENUM } from "shared/models";
import type { IEffectifDECA } from "shared/models/data/effectifsDECA.model";
import type { IOrganisation } from "shared/models/data/organisations.model";
import type { IOrganisme } from "shared/models/data/organismes.model";
import { getAnneeScolaireListFromDateRange, getAnneesScolaireListFromDate } from "shared/utils";
import type { PartialDeep } from "type-fest";
import { describe, it, beforeEach, expect } from "vitest";

import { getCfaEffectifDetail } from "@/common/actions/cfa/cfa-effectifs.actions";
import {
  getCfaSuiviMissionLocale,
  getCfaSuiviMissionLocaleExportRows,
} from "@/common/actions/cfa/cfa-suivi-mission-locale.actions";
import { DATE_START_RUPTURES } from "@/common/actions/shared/rupture-pipeline.utils";
import {
  effectifsDb,
  effectifsDECADb,
  missionLocaleEffectifsDb,
  organisationsDb,
  organismesDb,
} from "@/common/model/collections";
import { createRandomOrganisme, createSampleEffectif } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";
import { DeepPartial, id, testDoc, testDocs } from "@tests/utils/testUtils";

const DAY = 24 * 60 * 60 * 1000;

const organismeId = new ObjectId(id(1));
const mlOrganisationId = new ObjectId(id(2));
const anneeScolaire = getAnneeScolaireListFromDateRange(DATE_START_RUPTURES, new Date())[0];

const sampleOrganisme = {
  _id: organismeId,
  ...createRandomOrganisme({ siret: "19040492100016" }),
};

const organisation: IOrganisationOrganismeFormation = {
  _id: new ObjectId(id(10)),
  type: "ORGANISME_FORMATION",
  siret: "19040492100016",
  uai: null,
  organisme_id: organismeId.toString(),
  created_at: new Date(),
};

const baseParams = { page: 1, limit: 20, sort: "date_rupture", order: "desc" as const };

interface MlEffectifOverrides {
  date_rupture?: Date | null;
  apprenant?: PartialDeep<IEffectif["apprenant"]>;
  situation?: IMissionLocaleEffectif["situation"];
  organisme_data?: DeepPartial<IMissionLocaleEffectif["organisme_data"]>;
  whatsapp_contact?: DeepPartial<IMissionLocaleEffectif["whatsapp_contact"]>;
}

async function createMlEffectif(overrides: MlEffectifOverrides = {}) {
  const now = new Date();
  const dateRupture = overrides.date_rupture ?? new Date(now.getTime() - 60 * DAY);

  const snapshot = await createSampleEffectif({
    organisme: sampleOrganisme,
    annee_scolaire: anneeScolaire,
    apprenant: {
      date_de_naissance: new Date(now.getFullYear() - 20, 0, 1),
      ...overrides.apprenant,
    },
  });

  return {
    _id: new ObjectId(),
    mission_locale_id: mlOrganisationId,
    effectif_id: new ObjectId(),
    effectif_snapshot: {
      ...snapshot,
      _id: new ObjectId(),
      organisme_id: organismeId,
      _computed: {
        ...snapshot._computed,
        statut: { ...snapshot._computed?.statut, en_cours: STATUT_APPRENANT.RUPTURANT },
      },
    },
    effectif_snapshot_date: now,
    date_rupture: dateRupture,
    current_status: { value: STATUT_APPRENANT.RUPTURANT, date: dateRupture },
    created_at: now,
    brevo: { token: randomUUID(), token_created_at: now },
    ...(overrides.situation ? { situation: overrides.situation } : {}),
    ...(overrides.organisme_data ? { organisme_data: overrides.organisme_data } : {}),
    ...(overrides.whatsapp_contact ? { whatsapp_contact: overrides.whatsapp_contact } : {}),
  };
}

describe("getCfaSuiviMissionLocale", () => {
  useMongo();

  beforeEach(async () => {
    await missionLocaleEffectifsDb().deleteMany({});
    await organismesDb().deleteMany({});
    await organismesDb().insertOne(sampleOrganisme);
  });

  it("retourne des compteurs vides sans dossier", async () => {
    const result = await getCfaSuiviMissionLocale(organisation, true, { ...baseParams, category: "tous" });
    expect(result.pagination.total).toBe(0);
    expect(result.counts).toEqual({ collab: 0, hors_collab: 0, tous: 0 });
  });

  it("classe collab, hors-collab contacté, et exclut les non-contactés", async () => {
    const docs = await Promise.all([
      // Collab : acc_conjoint = true
      createMlEffectif({ organisme_data: { acc_conjoint: true, rupture: true } }),
      // Hors-collab contacté : situation posée, pas d'acc_conjoint
      createMlEffectif({ situation: SITUATION_ENUM.RDV_PRIS }),
      // Hors-collab NON contacté : ni acc_conjoint ni situation → exclu de "Tous"
      createMlEffectif({}),
    ]);
    await missionLocaleEffectifsDb().insertMany(testDocs<IMissionLocaleEffectif>(docs));

    const tous = await getCfaSuiviMissionLocale(organisation, true, { ...baseParams, category: "tous" });
    expect(tous.counts).toEqual({ collab: 1, hors_collab: 1, tous: 2 });
    expect(tous.pagination.total).toBe(2);

    const collab = await getCfaSuiviMissionLocale(organisation, true, { ...baseParams, category: "collab" });
    expect(collab.pagination.total).toBe(1);
    expect(collab.effectifs[0].collab_status).toBe("collab_demandee");

    const horsCollab = await getCfaSuiviMissionLocale(organisation, true, { ...baseParams, category: "hors_collab" });
    expect(horsCollab.pagination.total).toBe(1);
    expect(horsCollab.effectifs[0].collab_status).toBe("contacte_par_ml_hors_collab");
  });

  it("inclut toute qualification ML hors collab et la préqualif WhatsApp", async () => {
    const docs = await Promise.all([
      createMlEffectif({ situation: SITUATION_ENUM.INJOIGNABLE_APRES_RELANCES }),
      createMlEffectif({ situation: SITUATION_ENUM.COORDONNEES_INCORRECT }),
      createMlEffectif({ situation: SITUATION_ENUM.CONTACTE_SANS_RETOUR }),
      createMlEffectif({ whatsapp_contact: { phone_normalized: "+33600000000", user_response: "prequalif_yes" } }),
      createMlEffectif({}),
    ]);
    await missionLocaleEffectifsDb().insertMany(testDocs<IMissionLocaleEffectif>(docs));

    const tous = await getCfaSuiviMissionLocale(organisation, true, { ...baseParams, category: "tous" });
    expect(tous.counts).toEqual({ collab: 0, hors_collab: 4, tous: 4 });

    const horsCollab = await getCfaSuiviMissionLocale(organisation, true, { ...baseParams, category: "hors_collab" });
    expect(horsCollab.pagination.total).toBe(4);
    expect(horsCollab.effectifs.every((e) => e.collab_status === "contacte_par_ml_hors_collab")).toBe(true);
  });

  it("trie sur le nom de la Mission Locale sans perdre les filtres", async () => {
    const autreMlId = new ObjectId(id(3));
    await organisationsDb().insertMany(
      testDocs<IOrganisation>([
        {
          _id: mlOrganisationId,
          type: "MISSION_LOCALE",
          nom: "ML ZEBRE",
          ml_id: 4242,
          adresse: { commune: "Mérignac" },
          created_at: new Date(),
        },
        {
          _id: autreMlId,
          type: "MISSION_LOCALE",
          nom: "ML ALPHA",
          ml_id: 4243,
          adresse: { commune: "Albi" },
          created_at: new Date(),
        },
      ])
    );

    const [zebre, alpha, exclu] = await Promise.all([
      createMlEffectif({ situation: SITUATION_ENUM.RDV_PRIS, apprenant: { nom: "MARTIN", prenom: "Zoe" } }),
      createMlEffectif({ situation: SITUATION_ENUM.RDV_PRIS, apprenant: { nom: "MARTIN", prenom: "Alex" } }),
      createMlEffectif({ situation: SITUATION_ENUM.RDV_PRIS, apprenant: { nom: "DUPONT", prenom: "Chris" } }),
    ]);
    await missionLocaleEffectifsDb().insertMany(
      testDocs<IMissionLocaleEffectif>([zebre, { ...alpha, mission_locale_id: autreMlId }, exclu])
    );

    const result = await getCfaSuiviMissionLocale(organisation, true, {
      ...baseParams,
      category: "tous",
      sort: "mission_locale",
      order: "asc",
      search: "martin",
    });

    expect(result.effectifs.map((e) => e.mission_locale?.nom)).toEqual(["ML ALPHA", "ML ZEBRE"]);
    expect(result.pagination.total).toBe(2);
  });

  describe("dossiers portés par un autre établissement de la famille", () => {
    const formateurId = new ObjectId(id(20));
    const etrangerId = new ObjectId(id(21));
    const jeune = { nom: "MANCEAU", prenom: "Malika", date_de_naissance: new Date(Date.UTC(2007, 7, 15)) };

    beforeEach(async () => {
      await effectifsDb().deleteMany({});
      await effectifsDECADb().deleteMany({});
      const formateurSiret = "13000460900066";
      await organismesDb().updateOne(
        { _id: organismeId },
        { $set: { organismesFormateurs: [{ _id: formateurId, siret: formateurSiret }] } }
      );
      await organismesDb().insertMany(
        testDocs<IOrganisme>([
          {
            _id: formateurId,
            ...createRandomOrganisme(),
            siret: formateurSiret,
            organismesResponsables: [{ _id: organismeId, siret: sampleOrganisme.siret }],
          },
          { _id: etrangerId, ...createRandomOrganisme(), siret: "13000460900017" },
        ])
      );
    });

    async function insererEffectifDecaDuResponsable() {
      const effectif = {
        _id: new ObjectId(),
        deca_raw_id: new ObjectId(),
        ...(await createSampleEffectif({
          organisme: sampleOrganisme,
          annee_scolaire: getAnneesScolaireListFromDate(new Date())[0],
          apprenant: jeune,
          source: SOURCE_APPRENANT.DECA,
        })),
      };
      await effectifsDECADb().insertOne(testDoc<IEffectifDECA>(effectif));
      return effectif._id;
    }

    async function insererEffectifErpDuResponsable() {
      const effectif = {
        _id: new ObjectId(),
        ...(await createSampleEffectif({
          organisme: sampleOrganisme,
          annee_scolaire: getAnneesScolaireListFromDate(new Date())[0],
          apprenant: jeune,
        })),
      };
      await effectifsDb().insertOne(testDoc<IEffectif>(effectif));
      return effectif._id;
    }

    async function insererDossierPortePar(porteurId: ObjectId, overrides: MlEffectifOverrides = {}) {
      const doc = await createMlEffectif({
        apprenant: jeune,
        situation: SITUATION_ENUM.COORDONNEES_INCORRECT,
        ...overrides,
      });
      await missionLocaleEffectifsDb().insertOne(
        testDoc<IMissionLocaleEffectif>({
          ...doc,
          effectif_snapshot: { ...doc.effectif_snapshot, organisme_id: porteurId },
          identifiant_normalise: jeune,
        })
      );
      return doc._id;
    }

    it("ajoute au hors collab le dossier qualifié porté par un formateur, avec l'effectif du responsable", async () => {
      const effectifDecaId = await insererEffectifDecaDuResponsable();
      await insererDossierPortePar(formateurId);

      const result = await getCfaSuiviMissionLocale(organisation, true, { ...baseParams, category: "hors_collab" });

      expect(result.counts).toEqual({ collab: 0, hors_collab: 1, tous: 1 });
      expect(result.effectifs).toHaveLength(1);
      expect(result.effectifs[0].id?.toString()).toBe(effectifDecaId.toString());
      expect(result.effectifs[0].source).toBe("effectifsDECA");
      expect(result.effectifs[0].collab_status).toBe("contacte_par_ml_hors_collab");

      const rows = await getCfaSuiviMissionLocaleExportRows(organisation, true);
      expect(rows.map((r) => r.nom)).toEqual(["MANCEAU"]);

      const detail = await getCfaEffectifDetail(organismeId, effectifDecaId.toString());
      expect(detail.effectif).toMatchObject({ situation: { situation: SITUATION_ENUM.COORDONNEES_INCORRECT } });
    });

    it("ne garde qu'une ligne quand le jeune a un effectif ERP et DECA, avec l'effectif ERP", async () => {
      const effectifErpId = await insererEffectifErpDuResponsable();
      await insererEffectifDecaDuResponsable();
      await insererDossierPortePar(formateurId);

      const result = await getCfaSuiviMissionLocale(organisation, true, { ...baseParams, category: "hors_collab" });

      expect(result.counts.hors_collab).toBe(1);
      expect(result.effectifs[0].id?.toString()).toBe(effectifErpId.toString());
      expect(result.effectifs[0].source).toBe("effectifs");
    });

    it("sans accès DECA, ne rapproche pas l'effectif DECA de l'établissement", async () => {
      await insererEffectifDecaDuResponsable();
      await insererDossierPortePar(formateurId);

      const result = await getCfaSuiviMissionLocale(organisation, false, { ...baseParams, category: "tous" });

      expect(result.counts.tous).toBe(0);
    });

    it("n'ajoute pas le dossier d'un jeune que l'établissement n'a pas", async () => {
      await insererDossierPortePar(formateurId);

      const result = await getCfaSuiviMissionLocale(organisation, true, { ...baseParams, category: "tous" });

      expect(result.counts.tous).toBe(0);
    });

    it("n'ajoute pas un dossier de la famille en collab", async () => {
      await insererEffectifDecaDuResponsable();
      await insererDossierPortePar(formateurId, { organisme_data: { acc_conjoint: true } });

      const result = await getCfaSuiviMissionLocale(organisation, true, { ...baseParams, category: "tous" });

      expect(result.counts).toEqual({ collab: 0, hors_collab: 0, tous: 0 });
    });

    it("n'ajoute pas un dossier porté par un établissement hors famille", async () => {
      await insererEffectifDecaDuResponsable();
      await insererDossierPortePar(etrangerId);

      const result = await getCfaSuiviMissionLocale(organisation, true, { ...baseParams, category: "tous" });

      expect(result.counts.tous).toBe(0);
    });
  });
});
