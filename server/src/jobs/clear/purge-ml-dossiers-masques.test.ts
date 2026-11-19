import { ObjectId } from "mongodb";
import { SOURCE_APPRENANT, STATUT_APPRENANT } from "shared/constants";
import type { IEffectif, IEffectifComputedStatut } from "shared/models/data/effectifs.model";
import type { IEffectifDECA } from "shared/models/data/effectifsDECA.model";
import type { IMissionLocaleEffectif } from "shared/models/data/missionLocaleEffectif.model";
import type { IMissionLocaleEffectifLog } from "shared/models/data/missionLocaleEffectifLog.model";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createMissionLocaleSnapshot } from "@/common/actions/mission-locale/mission-locale.actions";
import {
  effectifsDb,
  effectifsDECADb,
  missionLocaleEffectifsDb,
  missionLocaleEffectifsLogDb,
  organisationsDb,
} from "@/common/model/collections";
import { useMongo } from "@tests/jest/setupMongo";

import { purgerDossiersMlMasques } from "./purge-ml-dossiers-masques";

vi.mock("@/common/services/classifier/classifier", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/common/services/classifier/classifier")>();
  return { ...actual, scoreEffectifs: vi.fn().mockResolvedValue({ model: "2026-03-16", scores: [0.5] }) };
});

useMongo();

const ML_ID = 609;
const missionLocaleId = new ObjectId();
const debutContrat = new Date("2025-09-01");
const dateRupture = new Date("2025-12-01");

type Parcours = IEffectifComputedStatut["parcours"];

const parcoursApprenti: Parcours = [{ date: debutContrat, valeur: STATUT_APPRENANT.APPRENTI }];
const parcoursRupturant: Parcours = [...parcoursApprenti, { date: dateRupture, valeur: STATUT_APPRENANT.RUPTURANT }];

const apprenant = () => ({
  nom: "DUPONT",
  prenom: "Jean",
  date_de_naissance: new Date(new Date().getFullYear() - 20, 0, 1),
  telephone: "0612345678",
  courriel: "jean.dupont@example.com",
  historique_statut: [],
  has_nir: false,
  adresse: { code_postal: "75001", mission_locale_id: ML_ID },
});

const effectifErp = (parcours: Parcours, _id = new ObjectId()) =>
  ({
    _id,
    organisme_id: new ObjectId(),
    id_erp_apprenant: "erp-1",
    source: SOURCE_APPRENANT.ERP,
    annee_scolaire: "2025-2026",
    apprenant: apprenant(),
    formation: { cfd: "50022137", rncp: "RNCP12345", periode: [2025, 2026], date_fin: new Date("2026-06-30") },
    contrats: [
      {
        siret: "12345678901234",
        date_debut: debutContrat,
        date_fin: new Date("2026-06-30"),
        date_rupture: dateRupture,
      },
    ],
    _computed: {
      organisme: { uai: "0802004U", siret: "77937827200016", region: "11" },
      statut: { en_cours: parcours[parcours.length - 1].valeur, parcours },
    },
    created_at: new Date(),
    updated_at: new Date(),
  }) as IEffectif;

const effectifDeca = (parcours: Parcours, _id = new ObjectId()) =>
  ({
    ...effectifErp(parcours, _id),
    source: "DECA",
    deca_raw_id: new ObjectId(),
    is_deca_compatible: true,
  }) as unknown as IEffectifDECA;

const dossierMasque = (effectif_id: ObjectId, extra: Record<string, unknown> = {}) => ({
  _id: new ObjectId(),
  mission_locale_id: missionLocaleId,
  effectif_id,
  soft_deleted: true,
  created_at: new Date("2025-05-28"),
  current_status: { value: STATUT_APPRENANT.APPRENTI, date: debutContrat },
  effectif_snapshot: { apprenant: { nom: "DUPONT" } },
  ...extra,
});

const insererDossiers = async (dossiers: ReturnType<typeof dossierMasque>[]) => {
  await missionLocaleEffectifsDb().insertMany(dossiers as unknown as IMissionLocaleEffectif[], {
    bypassDocumentValidation: true,
  });
};

const log = (mission_locale_effectif_id: ObjectId, extra: Partial<IMissionLocaleEffectifLog> = {}) => ({
  _id: new ObjectId(),
  mission_locale_effectif_id,
  created_at: new Date("2025-05-28"),
  read_by: [],
  ...extra,
});

const idsDossiers = async () =>
  (
    await missionLocaleEffectifsDb()
      .find({}, { projection: { _id: 1 } })
      .toArray()
  ).map(({ _id }) => _id.toString());

describe("purgerDossiersMlMasques()", () => {
  it("supprime un dossier masqué sans trace avec ses logs", async () => {
    const effectif = effectifErp(parcoursApprenti);
    await effectifsDb().insertOne(effectif, { bypassDocumentValidation: true });
    const masque = dossierMasque(effectif._id);
    const autre = dossierMasque(new ObjectId(), { soft_deleted: false });
    await insererDossiers([masque, autre]);
    const logAutre = log(autre._id);
    await missionLocaleEffectifsLogDb().insertMany([log(masque._id), logAutre]);

    const resultat = await purgerDossiersMlMasques();

    expect(resultat).toStrictEqual({
      dryRun: false,
      candidats: 1,
      gardes: { rupturant: 0, log: 0 },
      supprimes: 1,
      logsSupprimes: 1,
    });
    expect(await idsDossiers()).toStrictEqual([autre._id.toString()]);
    expect(await missionLocaleEffectifsLogDb().find({}).toArray()).toStrictEqual([logAutre]);
  });

  it("supprime un dossier masqué dont l'effectif n'existe plus", async () => {
    await insererDossiers([dossierMasque(new ObjectId())]);

    const resultat = await purgerDossiersMlMasques();

    expect(resultat.supprimes).toBe(1);
    expect(await idsDossiers()).toStrictEqual([]);
  });

  it("garde les dossiers masqués qui portent une trace humaine", async () => {
    const dossiers = [
      dossierMasque(new ObjectId(), { organisme_data: { reponse_at: new Date("2025-06-01") } }),
      dossierMasque(new ObjectId(), { organisme_data: { acc_conjoint: true } }),
      dossierMasque(new ObjectId(), { situation: "RDV_PRIS" }),
      dossierMasque(new ObjectId(), { whatsapp_contact: { phone_normalized: "33612345678" } }),
      dossierMasque(new ObjectId(), { souhaite_rdv: true }),
      dossierMasque(new ObjectId(), { cfa_rupture_declaration: { date_rupture: dateRupture } }),
    ];
    await insererDossiers(dossiers);

    const resultat = await purgerDossiersMlMasques();

    expect(resultat.candidats).toBe(0);
    expect((await idsDossiers()).sort()).toStrictEqual(dossiers.map(({ _id }) => _id.toString()).sort());
  });

  it("garde un dossier masqué dont un log est rempli", async () => {
    const masque = dossierMasque(new ObjectId());
    await insererDossiers([masque]);
    await missionLocaleEffectifsLogDb().insertOne(log(masque._id, { commentaires: "Rappelé, messagerie" }));

    const resultat = await purgerDossiersMlMasques();

    expect(resultat.gardes).toStrictEqual({ rupturant: 0, log: 1 });
    expect(await idsDossiers()).toStrictEqual([masque._id.toString()]);
    expect(await missionLocaleEffectifsLogDb().countDocuments()).toBe(1);
  });

  it("garde les dossiers masqués dont l'effectif est redevenu rupturant", async () => {
    const erp = effectifErp(parcoursRupturant);
    const deca = effectifDeca(parcoursRupturant);
    await effectifsDb().insertOne(erp, { bypassDocumentValidation: true });
    await effectifsDECADb().insertOne(deca, { bypassDocumentValidation: true });
    await insererDossiers([dossierMasque(erp._id), dossierMasque(deca._id)]);

    const resultat = await purgerDossiersMlMasques();

    expect(resultat.gardes).toStrictEqual({ rupturant: 2, log: 0 });
    expect(await idsDossiers()).toHaveLength(2);
  });

  it("n'écrit rien en simulation", async () => {
    const masque = dossierMasque(new ObjectId());
    await insererDossiers([masque]);
    await missionLocaleEffectifsLogDb().insertOne(log(masque._id));

    const resultat = await purgerDossiersMlMasques({ dryRun: true });

    expect(resultat).toStrictEqual({
      dryRun: true,
      candidats: 1,
      gardes: { rupturant: 0, log: 0 },
      supprimes: 1,
      logsSupprimes: 1,
    });
    expect(await idsDossiers()).toStrictEqual([masque._id.toString()]);
    expect(await missionLocaleEffectifsLogDb().countDocuments()).toBe(1);
  });

  describe("après la purge", () => {
    beforeEach(async () => {
      await organisationsDb().insertOne({
        _id: missionLocaleId,
        type: "MISSION_LOCALE",
        nom: "MA MISSION LOCALE",
        created_at: new Date(),
        ml_id: ML_ID,
        email: "",
        telephone: "",
        site_web: "",
      });
    });

    it("ne recrée pas de dossier pour une rupture hors délai de conservation", async () => {
      const parcoursRuptureAncienne: Parcours = [
        { date: new Date("2023-09-01"), valeur: STATUT_APPRENANT.APPRENTI },
        { date: new Date("2024-03-01"), valeur: STATUT_APPRENANT.RUPTURANT },
      ];
      const nouveau = effectifErp(parcoursRuptureAncienne);
      const suivi = effectifErp(parcoursRupturant);
      expect((await createMissionLocaleSnapshot(suivi))?.upserted).toBe(true);

      const creation = await createMissionLocaleSnapshot(nouveau);
      await createMissionLocaleSnapshot(effectifErp(parcoursRuptureAncienne, suivi._id));

      expect(creation?.upserted).toBe(false);
      expect(await missionLocaleEffectifsDb().countDocuments({ effectif_id: nouveau._id })).toBe(0);
      expect((await missionLocaleEffectifsDb().findOne({ effectif_id: suivi._id }))?.current_status).toStrictEqual({
        value: STATUT_APPRENANT.RUPTURANT,
        date: new Date("2024-03-01"),
      });
    });

    it("donne un dossier visible à un apprenti qui redevient rupturant", async () => {
      const effectif = effectifErp(parcoursApprenti);
      await effectifsDb().insertOne(effectif, { bypassDocumentValidation: true });
      await insererDossiers([dossierMasque(effectif._id)]);

      await purgerDossiersMlMasques();
      await createMissionLocaleSnapshot(effectifErp(parcoursRupturant, effectif._id));

      const dossiers = await missionLocaleEffectifsDb().find({ effectif_id: effectif._id }).toArray();
      expect(dossiers).toHaveLength(1);
      expect(dossiers[0].soft_deleted).toBeUndefined();
    });

    it("ne recrée pas un doublon DECA dont le jumeau ERP est actif dans la même ML", async () => {
      const decaId = new ObjectId();
      expect((await createMissionLocaleSnapshot(effectifDeca(parcoursRupturant, decaId)))?.upserted).toBe(true);
      const erp = effectifErp(parcoursRupturant);
      expect((await createMissionLocaleSnapshot(erp))?.upserted).toBe(true);
      await effectifsDb().insertOne(erp, { bypassDocumentValidation: true });
      await effectifsDECADb().insertOne(effectifDeca(parcoursApprenti, decaId), { bypassDocumentValidation: true });

      const resultat = await purgerDossiersMlMasques();
      const recreation = await createMissionLocaleSnapshot(effectifDeca(parcoursRupturant, decaId));

      expect(resultat.supprimes).toBe(1);
      expect(recreation?.upserted).toBe(false);
      const dossiers = await missionLocaleEffectifsDb().find({}).toArray();
      expect(dossiers.map(({ effectif_id }) => effectif_id.toString())).toStrictEqual([erp._id.toString()]);
    });
  });
});
