import { ObjectId } from "mongodb";
import { SOURCE_APPRENANT } from "shared/constants";
import { IEffectif } from "shared/models/data/effectifs.model";
import { it, expect, describe } from "vitest";

import { mergeEffectif } from "@/jobs/ingestion/process-ingestion";

describe("mergeEffectif", () => {
  it("should merge effectif", async () => {
    const previousEffectif: IEffectif = {
      _id: new ObjectId(),
      source: SOURCE_APPRENANT.FICHIER,
      apprenant: {
        nom: "FLEURY",
        prenom: "Fortuné",
        telephone: "0123456789",
        historique_statut: [
          {
            valeur_statut: 3,
            date_statut: new Date("2022-12-28T04:05:47.647Z"),
            date_reception: expect.anything(),
          },
        ],
        ine: "402957826QH",
        date_de_naissance: new Date("1999-08-31T16:21:32"),
        adresse: {
          code_insee: "05109",
          code_postal: "05109",
          commune: "[NOM_DE_LA_COMMUNE]",
          departement: "05",
          academie: "2",
          region: "93",
        },
      },
      contrats: [],
      formation: {
        cfd: "50033610",
        annee: 0,
        periode: [2022, 2024],
        libelle_long: "TEST",
      },
      id_erp_apprenant: "12345",

      annee_scolaire: "2024-2025",
      created_at: new Date("2021-09-28T04:05:47.647Z"),
      updated_at: new Date("2021-09-28T04:05:47.647Z"),
      organisme_id: new ObjectId("6152d7d3e6b5a5a5a5a5a5a5"),
    };

    const merged = mergeEffectif(previousEffectif, {
      ...previousEffectif,
      apprenant: {
        ...previousEffectif.apprenant,
        nom: "FLEURY 2",
        prenom: "",
        telephone: undefined,
        historique_statut: [],
        adresse: {
          ...previousEffectif.apprenant.adresse,
          commune: "remplacé",
        },
      },
      contrats: [],
    });
    expect(merged).toStrictEqual({
      ...previousEffectif,
      apprenant: {
        ...previousEffectif.apprenant,
        nom: "FLEURY 2",
        date_de_naissance: expect.any(Date),
        adresse: {
          ...previousEffectif.apprenant.adresse,
          commune: "remplacé",
        },
      },
      updated_at: expect.any(Date),
      organisme_id: new ObjectId("6152d7d3e6b5a5a5a5a5a5a5"),
    });
  });
});
