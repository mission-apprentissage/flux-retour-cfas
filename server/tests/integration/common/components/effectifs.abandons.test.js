import { strict as assert } from "assert";
import { createRandomDossierApprenant } from "../../../data/randomizedSample.js";

import {
  historySequenceInscritToApprentiToAbandon,
  historySequenceApprenti,
  historySequenceInscritToApprenti,
} from "../../../data/historySequenceSamples.js";

import { EffectifsAbandons } from "../../../../src/common/components/effectifs/abandons.js";
import { dossiersApprenantsMigrationDb } from "../../../../src/common/model/collections.js";

describe("Components Effectifs Abandons Test", () => {
  const seedDossiersApprenants = async (statutsProps) => {
    const abandonsStatuts = [];

    // Add 10 statuts with history sequence - full
    for (let index = 0; index < 10; index++) {
      const randomStatut = createRandomDossierApprenant({
        historique_statut_apprenant: historySequenceInscritToApprentiToAbandon,
        ...statutsProps,
      });
      const { insertedId } = await dossiersApprenantsMigrationDb().insertOne(randomStatut);
      abandonsStatuts.push(await dossiersApprenantsMigrationDb().findOne({ _id: insertedId }));
    }

    // Add 5 statuts with history sequence - simple apprenti
    for (let index = 0; index < 5; index++) {
      const randomStatut = createRandomDossierApprenant({
        historique_statut_apprenant: historySequenceApprenti,
        ...statutsProps,
      });
      await dossiersApprenantsMigrationDb().insertOne(randomStatut);
    }

    // Add 15 statuts with history sequence - inscritToApprenti
    for (let index = 0; index < 15; index++) {
      const randomStatut = createRandomDossierApprenant({
        historique_statut_apprenant: historySequenceInscritToApprenti,
        ...statutsProps,
      });
      await dossiersApprenantsMigrationDb().insertOne(randomStatut);
    }

    return abandonsStatuts;
  };

  const abandons = new EffectifsAbandons();

  describe("Abandons - getCountAtDate", () => {
    it("gets count of abandons at one date", async () => {
      await seedDossiersApprenants();

      const date = new Date("2020-09-15T00:00:00.000+0000");
      const abandonsCount = await abandons.getCountAtDate(date);

      assert.equal(abandonsCount, 0);
    });

    it("gets count of abandons at yet another date", async () => {
      await seedDossiersApprenants();

      const date = new Date("2020-10-10T00:00:00.000+0000");
      const abandonsCount = await abandons.getCountAtDate(date);

      assert.equal(abandonsCount, 10);
    });

    it("gets count of abandons at a date when there was no data", async () => {
      await seedDossiersApprenants();

      const date = new Date("2010-10-10T00:00:00.000+0000");
      const abandonsCount = await abandons.getCountAtDate(date);

      assert.equal(abandonsCount, 0);
    });

    it("gets count of abandons at a date and for a region", async () => {
      const filters = { etablissement_num_region: "28" };
      await seedDossiersApprenants(filters);

      const date = new Date("2020-10-10T00:00:00.000+0000");
      const abandonsCountForRegion = await abandons.getCountAtDate(date, filters);

      assert.equal(abandonsCountForRegion, 10);

      const abandonsCountForAnotherRegion = await abandons.getCountAtDate(date, { etablissement_num_region: "100" });
      assert.equal(abandonsCountForAnotherRegion, 0);
    });

    it("gets count of abandons at a date and for annee scolaire on same year and annee scolaire on two years", async () => {
      const filters = { uai_etablissement: "0670141P" };

      // Add 5 statuts abandon for annee_scolaire on same year
      for (let index = 0; index < 5; index++) {
        await dossiersApprenantsMigrationDb().insertOne(
          createRandomDossierApprenant({
            historique_statut_apprenant: historySequenceInscritToApprentiToAbandon,
            annee_scolaire: "2020-2020",
            ...filters,
          })
        );
      }

      // Add 12 statuts to abandon  for annee_scolaire on two years
      for (let index = 0; index < 12; index++) {
        await dossiersApprenantsMigrationDb().insertOne(
          createRandomDossierApprenant({
            historique_statut_apprenant: historySequenceInscritToApprentiToAbandon,
            annee_scolaire: "2021-2021",
            ...filters,
          })
        );
      }

      const date = new Date("2020-10-10T00:00:00.000+0000");
      const abandonsCountForAnneesScolaireList = await abandons.getCountAtDate(date, filters);

      assert.equal(abandonsCountForAnneesScolaireList, 17);
    });

    it("gets right count of abandons for edge case where historique is not sorted by date_statut", async () => {
      await dossiersApprenantsMigrationDb().insertOne(
        createRandomDossierApprenant({
          historique_statut_apprenant: [
            { valeur_statut: 0, date_statut: new Date("2025-10-01"), date_reception: new Date("2025-09-02") },
            { valeur_statut: 3, date_statut: new Date("2025-09-01"), date_reception: new Date("2025-10-02") },
          ],
          annee_scolaire: "2025-2026",
        })
      );

      const date = new Date("2025-10-01");
      const abandonsCountForAnneesScolaireList = await abandons.getCountAtDate(date, {
        annee_scolaire: "2025-2026",
      });

      assert.equal(abandonsCountForAnneesScolaireList, 1);
    });

    it("gets right count of abandons for edge case where multiple elements have the same date_statut but different date_reception", async () => {
      const sameDateStatut = new Date("2025-09-01");
      await dossiersApprenantsMigrationDb().insertOne(
        createRandomDossierApprenant({
          historique_statut_apprenant: [
            { valeur_statut: 0, date_statut: sameDateStatut, date_reception: new Date("2025-09-30") },
            { valeur_statut: 3, date_statut: sameDateStatut, date_reception: new Date("2025-09-15") },
          ],
          annee_scolaire: "2025-2026",
        })
      );

      const date = new Date("2025-10-01");
      const abandonsCountForAnneesScolaireList = await abandons.getCountAtDate(date, {
        annee_scolaire: "2025-2026",
      });

      assert.equal(abandonsCountForAnneesScolaireList, 1);
    });

    it("gets right count of abandons for edge case where multiple elements have the same date_statut but different date_reception (other case, no abandon)", async () => {
      const sameDateStatut = new Date("2025-09-01");
      await dossiersApprenantsMigrationDb().insertOne(
        createRandomDossierApprenant({
          historique_statut_apprenant: [
            { valeur_statut: 3, date_statut: sameDateStatut, date_reception: new Date("2025-09-20") },
            { valeur_statut: 0, date_statut: sameDateStatut, date_reception: new Date("2025-09-15") },
          ],
          annee_scolaire: "2025-2026",
        })
      );

      const date = new Date("2025-10-01");
      const abandonsCountForAnneesScolaireList = await abandons.getCountAtDate(date, {
        annee_scolaire: "2025-2026",
      });

      assert.equal(abandonsCountForAnneesScolaireList, 0);
    });
  });

  describe("Abandons - getListAtDate", () => {
    it("gets list of abandons at date with data", async () => {
      const abandonsStatuts = await seedDossiersApprenants();

      const date = new Date("2020-10-10T00:00:00.000+0000");
      const abandonsList = await abandons.getListAtDate(date);

      assert.equal(abandonsList.length, abandonsStatuts.length);
    });

    it("gets list of abandons at date with data - checks projection fields", async () => {
      const abandonsStatuts = await seedDossiersApprenants();

      const date = new Date("2020-10-10T00:00:00.000+0000");
      const projection = {
        uai_etablissement: 1,
        nom_etablissement: 1,
        formation_cfd: 1,
        annee_scolaire: 1,
      };
      const abandonsList = await abandons.getListAtDate(date, {}, { projection });

      assert.equal(abandonsList.length, abandonsStatuts.length);

      for (let index = 0; index < abandonsStatuts.length; index++) {
        assert.equal(abandonsList[index].uai_etablissement !== undefined, true);
        assert.equal(abandonsList[index].nom_etablissement !== undefined, true);
        assert.equal(abandonsList[index].formation_cfd !== undefined, true);
        assert.equal(abandonsList[index].annee_scolaire !== undefined, true);
      }
    });

    it("gets list of abandons at a date when there was no data", async () => {
      await seedDossiersApprenants();

      const date = new Date("2010-10-10T00:00:00.000+0000");
      const abandonsList = await abandons.getListAtDate(date);

      assert.equal(abandonsList.length, 0);
    });

    it("gets list of abandons at a date and for a region", async () => {
      const filters = { etablissement_num_region: "28" };
      const abandonsStatuts = await seedDossiersApprenants(filters);

      const date = new Date("2020-10-10T00:00:00.000+0000");
      const abandonsList = await abandons.getListAtDate(date, filters);

      assert.equal(abandonsList.length, abandonsStatuts.length);

      const abandonsListForOtherRegion = await abandons.getListAtDate(date, { etablissement_num_region: "100" });
      assert.equal(abandonsListForOtherRegion.length, 0);
    });
  });
});
