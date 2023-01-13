import { strict as assert } from "assert";
import { createRandomDossierApprenant } from "../../../data/randomizedSample.js";
import { EffectifsRupturantsFromDossiers } from "../../../../src/common/components/effectifs-dossiers/rupturants.dossiers.js";
import { dossiersApprenantsMigrationDb } from "../../../../src/common/model/collections.js";

describe("Components Effectifs Rupturants Test", () => {
  beforeEach(async () => {
    const statuts = [
      // following statuts are potential rupturants (depends on date)
      createRandomDossierApprenant({
        etablissement_num_region: "199",
        historique_statut_apprenant: [
          { valeur_statut: 3, date_statut: new Date("2020-09-13T00:00:00") },
          { valeur_statut: 2, date_statut: new Date("2020-10-01T00:00:00") },
        ],
      }),
      createRandomDossierApprenant({
        historique_statut_apprenant: [
          { valeur_statut: 3, date_statut: new Date("2020-09-13T00:00:00") },
          { valeur_statut: 2, date_statut: new Date("2020-10-01T00:00:00") },
          { valeur_statut: 3, date_statut: new Date("2020-11-01T00:00:00") },
        ],
      }),
      createRandomDossierApprenant({
        historique_statut_apprenant: [
          { valeur_statut: 1, date_statut: new Date("2020-03-01T00:00:00") },
          { valeur_statut: 3, date_statut: new Date("2020-07-29T00:00:00") },
          { valeur_statut: 2, date_statut: new Date("2020-09-20T00:00:00") },
          { valeur_statut: 0, date_statut: new Date("2020-12-07T00:00:00") },
        ],
      }),
      createRandomDossierApprenant({
        historique_statut_apprenant: [
          { valeur_statut: 1, date_statut: new Date("2020-07-29T00:00:00") },
          { valeur_statut: 2, date_statut: new Date("2020-09-20T00:00:00") },
          { valeur_statut: 3, date_statut: new Date("2020-12-07T00:00:00") },
          { valeur_statut: 2, date_statut: new Date("2020-12-21T00:00:00") },
        ],
      }),
      // following statuts cannot be rupturants
      createRandomDossierApprenant({
        historique_statut_apprenant: [{ valeur_statut: 2, date_statut: new Date("2020-03-22T00:00:00") }],
      }),
      createRandomDossierApprenant({
        historique_statut_apprenant: [{ valeur_statut: 3, date_statut: new Date("2020-11-01T00:00:00") }],
      }),
      createRandomDossierApprenant({
        historique_statut_apprenant: [
          { valeur_statut: 1, date_statut: new Date("2020-04-21T00:00:00") },
          { valeur_statut: 2, date_statut: new Date("2020-04-24T00:00:00") },
          { valeur_statut: 3, date_statut: new Date("2020-04-30T00:00:00") },
        ],
      }),
      createRandomDossierApprenant({
        etablissement_num_region: "199",
        historique_statut_apprenant: [{ valeur_statut: 2, date_statut: new Date("2020-02-01T00:00:00") }],
      }),
      createRandomDossierApprenant({
        etablissement_num_region: "199",
        historique_statut_apprenant: [{ valeur_statut: 3, date_statut: new Date("2020-05-15T00:00:00") }],
      }),
    ];
    for (let index = 0; index < statuts.length; index++) {
      await dossiersApprenantsMigrationDb().insertOne(statuts[index]);
    }
  });

  const rupturants = new EffectifsRupturantsFromDossiers();

  describe("Rupturants - getCountAtDate", () => {
    it("gets count of rupturants at date", async () => {
      const date = new Date("2020-10-12T00:00:00");
      const count = await rupturants.getCountAtDate(date);
      assert.equal(count, 3);
    });

    it("gets count of rupturants now", async () => {
      const date = new Date();
      const count = await rupturants.getCountAtDate(date);
      assert.equal(count, 2);
    });

    it("gets count of rupturants now with additional filter", async () => {
      const date = new Date();
      const count = await rupturants.getCountAtDate(date, { etablissement_num_region: "199" });
      assert.equal(count, 1);
    });

    it("gets count of rupturants at a date and for annee scolaire on same year and annee scolaire on two years", async () => {
      const filters = { uai_etablissement: "0670141P" };

      // Add 5 statuts rupturant for annee_scolaire on same year
      for (let index = 0; index < 5; index++) {
        await dossiersApprenantsMigrationDb().insertOne(
          createRandomDossierApprenant({
            historique_statut_apprenant: [
              { valeur_statut: 3, date_statut: new Date("2020-09-13T00:00:00") },
              { valeur_statut: 2, date_statut: new Date("2020-10-01T00:00:00") },
            ],
            annee_scolaire: "2020-2020",
            ...filters,
          })
        );
      }

      // Add 12 statuts rupturant for annee_scolaire on two years
      for (let index = 0; index < 12; index++) {
        await dossiersApprenantsMigrationDb().insertOne(
          createRandomDossierApprenant({
            historique_statut_apprenant: [
              { valeur_statut: 3, date_statut: new Date("2020-09-13T00:00:00") },
              { valeur_statut: 2, date_statut: new Date("2020-10-01T00:00:00") },
            ],
            annee_scolaire: "2021-2021",
            ...filters,
          })
        );
      }

      const date = new Date("2020-10-12T00:00:00");
      const rupturantsCountForAnneesScolaireList = await rupturants.getCountAtDate(date, filters);

      assert.equal(rupturantsCountForAnneesScolaireList, 17);
    });

    it("gets right count of rupturants for edge case where historique is not sorted by date_statut", async () => {
      await dossiersApprenantsMigrationDb().insertOne(
        createRandomDossierApprenant({
          historique_statut_apprenant: [
            { valeur_statut: 2, date_statut: new Date("2025-10-01"), date_reception: new Date("2025-10-02") },
            { valeur_statut: 3, date_statut: new Date("2025-09-01"), date_reception: new Date("2025-09-02") },
          ],
          annee_scolaire: "2025-2026",
        })
      );

      const date = new Date("2025-10-01");
      const rupturantsCountForAnneesScolaireList = await rupturants.getCountAtDate(date, {
        annee_scolaire: "2025-2026",
      });

      assert.equal(rupturantsCountForAnneesScolaireList, 1);
    });

    it("gets right count of rupturants for edge case where multiple elements have the same date_statut but different date_reception", async () => {
      const sameDateStatut = new Date("2025-09-01");
      await dossiersApprenantsMigrationDb().insertOne(
        createRandomDossierApprenant({
          historique_statut_apprenant: [
            { valeur_statut: 2, date_statut: sameDateStatut, date_reception: new Date("2025-09-15") },
            { valeur_statut: 3, date_statut: sameDateStatut, date_reception: new Date("2025-08-30") },
          ],
          annee_scolaire: "2025-2026",
        })
      );

      const date = new Date("2025-10-01");
      const rupturantsCountForAnneesScolaireList = await rupturants.getCountAtDate(date, {
        annee_scolaire: "2025-2026",
      });

      assert.equal(rupturantsCountForAnneesScolaireList, 1);
    });

    it("gets right count of rupturants for edge case where multiple elements have the same date_statut but different date_reception (other case, no rupturant)", async () => {
      const sameDateStatut = new Date("2025-09-01");
      await dossiersApprenantsMigrationDb().insertOne(
        createRandomDossierApprenant({
          historique_statut_apprenant: [
            { valeur_statut: 3, date_statut: sameDateStatut, date_reception: new Date("2025-09-15") },
            { valeur_statut: 2, date_statut: sameDateStatut, date_reception: new Date("2025-08-30") },
          ],
          annee_scolaire: "2025-2026",
        })
      );

      const date = new Date("2025-10-01");
      const rupturantsCountForAnneesScolaireList = await rupturants.getCountAtDate(date, {
        annee_scolaire: "2025-2026",
      });

      assert.equal(rupturantsCountForAnneesScolaireList, 0);
    });
  });

  describe("Rupturants - getListAtDate", () => {
    it("gets list of rupturants at date", async () => {
      const date = new Date("2020-10-12T00:00:00");
      const list = await rupturants.getListAtDate(date);
      assert.equal(list.length, 3);
    });

    it("gets list of rupturants now - check projection fields", async () => {
      const date = new Date();
      const projection = {
        uai_etablissement: 1,
        nom_etablissement: 1,
        formation_cfd: 1,
        annee_scolaire: 1,
      };
      const list = await rupturants.getListAtDate(date, {}, { projection });
      assert.equal(list.length, 2);
      for (let index = 0; index < list.length; index++) {
        assert.equal(list[index].uai_etablissement !== undefined, true);
        assert.equal(list[index].nom_etablissement !== undefined, true);
        assert.equal(list[index].formation_cfd !== undefined, true);
        assert.equal(list[index].annee_scolaire !== undefined, true);
      }
    });

    it("gets list of rupturants now with additional filter", async () => {
      const date = new Date();
      const list = await rupturants.getListAtDate(date, { etablissement_num_region: "199" });
      assert.equal(list.length, 1);
    });
  });
});
