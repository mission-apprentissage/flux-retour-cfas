import { ObjectId } from "mongodb";
import { STATUT_APPRENANT } from "shared/constants";
import { IOrganisationOrganismeFormation } from "shared/models";
import { getAnneeScolaireListFromDateRange } from "shared/utils";
import { v4 as uuidv4 } from "uuid";
import { describe, it, beforeEach, expect } from "vitest";

import { getCfaSuiviMissionLocale } from "@/common/actions/cfa/cfa-suivi-mission-locale.actions";
import { DATE_START_RUPTURES } from "@/common/actions/shared/rupture-pipeline.utils";
import { missionLocaleEffectifsDb, organismesDb } from "@/common/model/collections";
import { createRandomOrganisme, createSampleEffectif } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";
import { id } from "@tests/utils/testUtils";

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

async function createMlEffectif(overrides: Record<string, any> = {}) {
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
    brevo: { token: uuidv4(), token_created_at: now },
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
      createMlEffectif({ situation: "RDV_PRIS" }),
      // Hors-collab NON contacté : ni acc_conjoint ni situation → exclu de "Tous"
      createMlEffectif({}),
    ]);
    await missionLocaleEffectifsDb().insertMany(docs as any[]);

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

  it("exclut les hors-collab non joints et inclut la préqualif WhatsApp", async () => {
    const docs = await Promise.all([
      // Non joints (situation renseignée mais pas de contact abouti) → exclus
      createMlEffectif({ situation: "INJOIGNABLE_APRES_RELANCES" }),
      createMlEffectif({ situation: "COORDONNEES_INCORRECT" }),
      createMlEffectif({ situation: "CONTACTE_SANS_RETOUR" }),
      // Préqualif WhatsApp positive, sans situation ML → inclus
      createMlEffectif({ whatsapp_contact: { phone_normalized: "+33600000000", user_response: "prequalif_yes" } }),
    ]);
    await missionLocaleEffectifsDb().insertMany(docs as any[]);

    const tous = await getCfaSuiviMissionLocale(organisation, true, { ...baseParams, category: "tous" });
    expect(tous.counts).toEqual({ collab: 0, hors_collab: 1, tous: 1 });

    const horsCollab = await getCfaSuiviMissionLocale(organisation, true, { ...baseParams, category: "hors_collab" });
    expect(horsCollab.pagination.total).toBe(1);
    expect(horsCollab.effectifs[0].collab_status).toBe("contacte_par_ml_hors_collab");
  });
});
