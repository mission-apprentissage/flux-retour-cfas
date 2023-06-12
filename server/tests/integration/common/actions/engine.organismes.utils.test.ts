import { strict as assert } from "assert";

import { isOrganismeFiableForCouple } from "@/common/actions/engine/engine.organismes.utils";
import { organismesReferentielDb } from "@/common/model/collections";

describe("Tests des actions  engine utilitaires organismes", () => {
  describe("isOrganismeFiableForCouple", () => {
    const UAI_REFERENTIEL = "7722672E";
    const SIRET_REFERENTIEL = "99370584100099";

    const UAI_REFERENTIEL_FERME = "4422672E";
    const SIRET_REFERENTIEL_FERME = "44370584100099";

    beforeEach(async () => {
      // Création d'un organisme dans le référentiel avec un couple fiable
      await organismesReferentielDb().findOneAndUpdate(
        { uai: UAI_REFERENTIEL, siret: SIRET_REFERENTIEL, nature: "formateur" },
        { $set: { lieux_de_formation: [{ uai: UAI_REFERENTIEL }], relations: [] } },
        { upsert: true, returnDocument: "after" }
      );

      // Création d'un organisme FERME dans le référentiel avec un couple
      await organismesReferentielDb().findOneAndUpdate(
        { uai: UAI_REFERENTIEL_FERME, siret: SIRET_REFERENTIEL_FERME, nature: "formateur" },
        { $set: { lieux_de_formation: [{ uai: UAI_REFERENTIEL_FERME }], relations: [], etat_administratif: "fermé" } },
        { upsert: true, returnDocument: "after" }
      );
    });

    describe("Vérification des cas de couples non fiables", () => {
      it("Vérifie qu'on couple sans UAI fourni n'est pas fiable", async () => {
        const isOrganismeFiable = await isOrganismeFiableForCouple(null, SIRET_REFERENTIEL);
        assert.equal(isOrganismeFiable, false);
      });

      it("Vérifie qu'on couple sans SIRET fourni n'est pas fiable", async () => {
        const isOrganismeFiable = await isOrganismeFiableForCouple(UAI_REFERENTIEL, null);
        assert.equal(isOrganismeFiable, false);
      });

      it("Vérifie qu'on couple sans UAI ni SIRET fourni n'est pas fiable", async () => {
        const isOrganismeFiable = await isOrganismeFiableForCouple(null, null);
        assert.equal(isOrganismeFiable, false);
      });

      it("Vérifie qu'on couple avec un UAI non présent dans le référentiel n'est pas fiable", async () => {
        const UNKNOWN_UAI = "1111111A";
        const isOrganismeFiable = await isOrganismeFiableForCouple(UNKNOWN_UAI, SIRET_REFERENTIEL);
        assert.equal(isOrganismeFiable, false);
      });

      it("Vérifie qu'on couple avec un SIRET non présent dans le référentiel n'est pas fiable", async () => {
        const UNKNOWN_SIRET = "22222222220099";
        const isOrganismeFiable = await isOrganismeFiableForCouple(UAI_REFERENTIEL, UNKNOWN_SIRET);
        assert.equal(isOrganismeFiable, false);
      });

      it("Vérifie qu'on couple fermé dans le référentiel n'est pas fiable", async () => {
        const organismeFerme = await organismesReferentielDb().findOne({ uai: UAI_REFERENTIEL_FERME });
        assert.equal(organismeFerme?.etat_administratif, "fermé");

        const isOrganismeFiable = await isOrganismeFiableForCouple(UAI_REFERENTIEL_FERME, SIRET_REFERENTIEL_FERME);
        assert.equal(isOrganismeFiable, false);
      });
    });

    describe("Vérification des cas de couples fiables", () => {
      it("Vérifie qu'on couple dont l'UAI et le SIRET matchent dans le référentiel est pas fiable", async () => {
        const isOrganismeFiable = await isOrganismeFiableForCouple(UAI_REFERENTIEL, SIRET_REFERENTIEL);
        assert.equal(isOrganismeFiable, true);
      });
    });
  });
});
