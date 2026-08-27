import { ObjectId } from "mongodb";
import { getAnneesScolaireListFromDate } from "shared/utils";
import { describe, it, beforeEach, expect } from "vitest";

import { getCfaEffectifDetail } from "@/common/actions/cfa/cfa-effectifs.actions";
import { effectifsDb, missionLocaleEffectifsDb, organisationsDb, organismesDb } from "@/common/model/collections";
import { createSampleEffectif, createRandomOrganisme } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";
import { id } from "@tests/utils/testUtils";

const ANNEE_SCOLAIRE = getAnneesScolaireListFromDate(new Date())[0];
const organismeId = new ObjectId(id(1));
const mlOrganisationId = new ObjectId(id(2));
const effectifId = new ObjectId(id(4));

const sampleOrganisme = { _id: organismeId, ...createRandomOrganisme({ siret: "19040492100016" }) };

async function insertDossier(organismeData: Record<string, any>) {
  const snapshot = await createSampleEffectif({
    organisme: sampleOrganisme,
    annee_scolaire: ANNEE_SCOLAIRE,
    apprenant: {
      nom: "RECAP",
      prenom: "Test",
      date_de_naissance: new Date(new Date().getFullYear() - 20, 0, 1),
    },
  });
  await effectifsDb().insertOne({ ...snapshot, _id: effectifId, organisme_id: organismeId } as any);
  await missionLocaleEffectifsDb().insertOne({
    _id: new ObjectId(),
    mission_locale_id: mlOrganisationId,
    effectif_id: effectifId,
    effectif_snapshot: { ...snapshot, _id: effectifId, organisme_id: organismeId },
    effectif_snapshot_date: new Date(),
    date_rupture: null,
    created_at: new Date(),
    current_status: { value: null, date: null },
    organisme_data: organismeData,
  } as any);
}

describe("Récapitulatif du dossier de collaboration", () => {
  useMongo();

  beforeEach(async () => {
    await effectifsDb().deleteMany({});
    await missionLocaleEffectifsDb().deleteMany({});
    await organisationsDb().deleteMany({});
    await organismesDb().deleteMany({});
    await organismesDb().insertOne(sampleOrganisme);
  });

  it("expose les champs de situation au CFA", async () => {
    await insertDossier({
      acc_conjoint: true,
      situation_type: "SANS_CONTRAT",
      date_debut_formation: new Date("2026-01-06"),
      recherche_entreprise: "12 candidatures envoyées",
    });

    const { effectif } = await getCfaEffectifDetail(organismeId, effectifId.toString());
    const od = (effectif as any).organisme_data;

    expect(od.situation_type).toBe("SANS_CONTRAT");
    expect(od.recherche_entreprise).toBe("12 candidatures envoyées");
  });

  it("n'expose jamais le retour sur le formulaire", async () => {
    await insertDossier({
      acc_conjoint: true,
      situation_type: "EN_CONTRAT",
      risque_rupture: "MODERE",
      form_feedback: { note: 4, remarque: "Trop long", responded_at: new Date() },
    });

    const { effectif } = await getCfaEffectifDetail(organismeId, effectifId.toString());
    const od = (effectif as any).organisme_data;

    expect(od.risque_rupture).toBe("MODERE");
    expect(od.form_feedback).toBeUndefined();
  });
});
