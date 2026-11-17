import { cfdCodeFixtures, rncpCodeFixtures, siretFixtures, uaiFixtures } from "api-alternance-sdk/fixtures";
import { ObjectId } from "mongodb";
import type { IDossierApprenantSchemaV3 } from "shared/models/parts/dossierApprenantSchemaV3";
import { describe, expect, it, vi } from "vitest";

import { getCommune } from "@/common/apis/apiAlternance/apiAlternance";
import { formationV2Db, personV2Db } from "@/common/model/collections";
import { getDatabase } from "@/common/mongodb";
import { useMongo } from "@tests/jest/setupMongo";

import { handleEffectifTransmission } from "./process-ingestion.v2";

const juil24 = new Date("2024-07-21");
const sept24 = new Date("2024-09-01");
const aout26 = new Date("2026-08-31");

vi.mock("@/common/apis/apiAlternance/apiAlternance");

useMongo();

describe("process-ingestion.v2", () => {
  it("crée la personne et la formation de la transmission, sans effectif v2", async () => {
    const dossier = {
      nom_apprenant: "DOE",
      prenom_apprenant: "John",
      date_de_naissance_apprenant: new Date("1990-01-01"),

      annee_scolaire: "2024-2025",
      id_erp_apprenant: "#1",
      date_entree_formation: sept24,
      date_inscription_formation: juil24,
      date_fin_formation: aout26,

      formation_cfd: cfdCodeFixtures[13512840],
      formation_rncp: rncpCodeFixtures.RNCP36092,
      etablissement_responsable_siret: siretFixtures[19350030300014],
      etablissement_responsable_uai: uaiFixtures["0491801S"],
      etablissement_formateur_siret: siretFixtures[26590673500120],
      etablissement_formateur_uai: uaiFixtures["0631408N"],

      code_commune_insee_apprenant: "75056",
    } satisfies Partial<IDossierApprenantSchemaV3>;

    await handleEffectifTransmission({
      _id: new ObjectId(),
      source: "api",
      created_at: new Date(),
      updated_at: new Date(),
      ...dossier,
    });

    const persons = await personV2Db().find({}).toArray();
    expect(persons).toEqual([
      {
        _id: expect.any(ObjectId),
        identifiant: {
          nom: dossier.nom_apprenant,
          prenom: dossier.prenom_apprenant,
          date_de_naissance: dossier.date_de_naissance_apprenant,
        },
      },
    ]);

    const formations = await formationV2Db().find({}).toArray();
    expect(formations).toEqual([
      {
        _id: expect.any(ObjectId),
        identifiant: {
          cfd: dossier.formation_cfd,
          rncp: dossier.formation_rncp,
          responsable_siret: dossier.etablissement_responsable_siret,
          responsable_uai: dossier.etablissement_responsable_uai,
          formateur_siret: dossier.etablissement_formateur_siret,
          formateur_uai: dossier.etablissement_formateur_uai,
        },
        draft: true,
        organisme_formateur_id: null,
        organisme_responsable_id: null,
      },
    ]);

    expect(await getDatabase().collection("effectifV2").countDocuments()).toBe(0);
    expect(getCommune).not.toHaveBeenCalled();
  });
});
