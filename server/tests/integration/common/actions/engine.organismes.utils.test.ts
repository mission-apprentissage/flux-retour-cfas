import { ObjectId } from "mongodb";
import { it, expect, describe, beforeEach } from "vitest";

import { isOrganismeFiableForCouple } from "@/common/actions/engine/engine.organismes.utils";
import { organismesReferentielDb } from "@/common/model/collections";
import { useMongo } from "@tests/jest/setupMongo";

describe("Tests des actions  engine utilitaires organismes", () => {
  useMongo();
  describe("isOrganismeFiableForCouple", () => {
    const UAI_REFERENTIEL = "7722672E";
    const SIRET_REFERENTIEL = "99370584100099";

    const UAI_REFERENTIEL_FERME = "4422672E";
    const SIRET_REFERENTIEL_FERME = "44370584100099";

    beforeEach(async () => {
      // Création d'un organisme dans le référentiel avec un couple fiable et création d'un organisme ferme
      await organismesReferentielDb().insertMany([
        {
          _id: new ObjectId(),
          uai: UAI_REFERENTIEL,
          siret: SIRET_REFERENTIEL,
          nature: "formateur",
          lieux_de_formation: [{ uai: UAI_REFERENTIEL }],
          relations: [],
        },
        {
          _id: new ObjectId(),
          uai: UAI_REFERENTIEL_FERME,
          siret: SIRET_REFERENTIEL_FERME,
          nature: "formateur",
          lieux_de_formation: [{ uai: UAI_REFERENTIEL_FERME }],
          relations: [],
          etat_administratif: "fermé",
        },
      ]);
    });

    describe("Vérification des cas de couples non fiables", () => {
      const testsCases = [
        {
          label: "Vérifie qu'on couple sans UAI fourni n'est pas fiable",
          uai: undefined,
          siret: SIRET_REFERENTIEL,
          expectedFiable: false,
        },
        {
          label: "Vérifie qu'on couple sans SIRET fourni n'est pas fiable",
          uai: UAI_REFERENTIEL,
          siret: undefined,
          expectedFiable: false,
        },
        {
          label: "Vérifie qu'on couple sans UAI ni SIRET fourni n'est pas fiable",
          uai: undefined,
          siret: undefined,
          expectedFiable: false,
        },
        {
          label: "Vérifie qu'on couple avec un UAI non présent dans le référentiel n'est pas fiable",
          uai: "1111111A",
          siret: SIRET_REFERENTIEL,
          expectedFiable: false,
        },
        {
          label: "Vérifie qu'on couple avec un SIRET non présent dans le référentiel n'est pas fiable",
          uai: UAI_REFERENTIEL,
          siret: "22222222220099",
          expectedFiable: false,
        },
        {
          label: "Vérifie qu'on couple fermé dans le référentiel n'est pas fiable",
          uai: UAI_REFERENTIEL_FERME,
          siret: SIRET_REFERENTIEL_FERME,
          expectedFiable: false,
        },
      ];

      testsCases.forEach((test) => {
        it(test.label, async () => {
          await expect(isOrganismeFiableForCouple(test.uai, test.siret)).resolves.toBe(test.expectedFiable);
        });
      });
    });

    describe("Vérification des cas de couples fiables", () => {
      it("Vérifie qu'on couple dont l'UAI et le SIRET matchent dans le référentiel est pas fiable", async () => {
        await expect(isOrganismeFiableForCouple(UAI_REFERENTIEL, SIRET_REFERENTIEL)).resolves.toBe(true);
      });
    });
  });
});
