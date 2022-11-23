import { strict as assert } from "assert";
import { createRandomDossierApprenant } from "../../../data/randomizedSample.js";

import {
  historySequenceInscritToApprentiToAbandon,
  historySequenceApprenti,
  historySequenceInscritToApprenti,
} from "../../../data/historySequenceSamples.js";

import { RESEAUX_CFAS } from "../../../../src/common/constants/networksConstants.js";
import { EffectifsApprentis } from "../../../../src/common/components/effectifs/apprentis.js";
import { dossiersApprenantsDb } from "../../../../src/common/model/collections.js";

describe("Components Effectifs apprentis Test", () => {
  const seedDossiersApprenants = async (statutsProps) => {
    // Add 10 statuts with history sequence - full
    for (let index = 0; index < 10; index++) {
      const randomStatut = createRandomDossierApprenant({
        historique_statut_apprenant: historySequenceInscritToApprentiToAbandon,
        ...statutsProps,
      });
      await dossiersApprenantsDb().insertOne(randomStatut);
    }

    // Add 5 statuts with history sequence - simple apprenti
    for (let index = 0; index < 5; index++) {
      const randomStatut = createRandomDossierApprenant({
        historique_statut_apprenant: historySequenceApprenti,
        ...statutsProps,
      });
      await dossiersApprenantsDb().insertOne(randomStatut);
    }

    // Add 15 statuts with history sequence - inscritToApprenti
    for (let index = 0; index < 15; index++) {
      const randomStatut = createRandomDossierApprenant({
        historique_statut_apprenant: historySequenceInscritToApprenti,
        ...statutsProps,
      });
      await dossiersApprenantsDb().insertOne(randomStatut);
    }
  };

  const apprentis = new EffectifsApprentis();

  describe("Apprentis - getCountAtDate", () => {
    it("gets count of apprentis at one date", async () => {
      await seedDossiersApprenants();

      const date = new Date("2020-09-15T00:00:00.000+0000");
      const apprentisCount = await apprentis.getCountAtDate(date);

      assert.equal(apprentisCount, 5);
    });

    it("gets count of apprentis at another date", async () => {
      await seedDossiersApprenants();

      const date = new Date("2020-09-30T00:00:00.000+0000");
      const apprentisCount = await apprentis.getCountAtDate(date);

      assert.equal(apprentisCount, 15);
    });

    it("gets count of apprentis at yet another date", async () => {
      await seedDossiersApprenants();

      const date = new Date("2020-10-10T00:00:00.000+0000");
      const apprentisCount = await apprentis.getCountAtDate(date);

      assert.equal(apprentisCount, 5);
    });

    it("gets count of apprentis at a date when there was no data", async () => {
      await seedDossiersApprenants();

      const date = new Date("2010-10-10T00:00:00.000+0000");
      const apprentisCount = await apprentis.getCountAtDate(date);

      assert.equal(apprentisCount, 0);
    });

    it("gets count of apprentis at a date and for a region", async () => {
      const filters = { etablissement_num_region: "28" };
      await seedDossiersApprenants(filters);

      const date = new Date("2020-09-30T00:00:00.000+0000");
      const apprentisCountForRegion = await apprentis.getCountAtDate(date, filters);

      assert.equal(apprentisCountForRegion, 15);

      const apprentisCountForAnotherRegion = await apprentis.getCountAtDate(date, {
        etablissement_num_region: "100",
      });
      assert.equal(apprentisCountForAnotherRegion, 0);
    });

    it("gets count of apprentis at a date and for a departement", async () => {
      const filters = { etablissement_num_departement: "75" };
      await seedDossiersApprenants(filters);

      const date = new Date("2020-09-30T00:00:00.000+0000");
      const apprentisCountForDepartement = await apprentis.getCountAtDate(date, filters);

      assert.equal(apprentisCountForDepartement, 15);

      const apprentisCountForAnotherDepartement = await apprentis.getCountAtDate(date, {
        etablissement_num_departement: "100",
      });
      assert.equal(apprentisCountForAnotherDepartement, 0);
    });

    it("gets count of apprentis at a date and for a siret_etablissement", async () => {
      const filters = { siret_etablissement: "77929544300013" };
      await seedDossiersApprenants(filters);

      const date = new Date("2020-09-30T00:00:00.000+0000");
      const apprentisCountForSiret = await apprentis.getCountAtDate(date, filters);

      assert.equal(apprentisCountForSiret, 15);

      const apprentisCountForAnotherSiret = await apprentis.getCountAtDate(date, {
        siret_etablissement: "77929544300099",
      });
      assert.equal(apprentisCountForAnotherSiret, 0);
    });

    it("gets count of apprentis at a date and for a formation_cfd", async () => {
      const filters = { formation_cfd: "2502000D" };
      await seedDossiersApprenants(filters);

      const date = new Date("2020-09-30T00:00:00.000+0000");
      const apprentisCountForCfd = await apprentis.getCountAtDate(date, filters);

      assert.equal(apprentisCountForCfd, 15);

      const apprentisCountForAnotherCfd = await apprentis.getCountAtDate(date, { formation_cfd: "2502000X" });
      assert.equal(apprentisCountForAnotherCfd, 0);
    });

    it("gets count of apprentis at a date and for a reseau", async () => {
      const filters = { etablissement_reseaux: RESEAUX_CFAS.BTP_CFA.nomReseau };
      await seedDossiersApprenants(filters);

      const date = new Date("2020-09-30T00:00:00.000+0000");
      const apprentisCountForReseau = await apprentis.getCountAtDate(date, filters);

      assert.equal(apprentisCountForReseau, 15);

      const apprentisCountForAnotherReseau = await apprentis.getCountAtDate(date, {
        etablissement_reseaux: "inconnu",
      });
      assert.equal(apprentisCountForAnotherReseau, 0);
    });

    it("gets count of apprentis at a date and for annee scolaire on same year and annee scolaire on two years", async () => {
      const filters = { uai_etablissement: "0670141P" };

      // Add 5 statuts apprenti for annee_scolaire on same year
      for (let index = 0; index < 5; index++) {
        await dossiersApprenantsDb().insertOne(
          createRandomDossierApprenant({
            historique_statut_apprenant: historySequenceApprenti,
            annee_scolaire: "2020-2020",
            ...filters,
          })
        );
      }

      // Add 12 statuts apprenti for annee_scolaire on two years
      for (let index = 0; index < 12; index++) {
        await dossiersApprenantsDb().insertOne(
          createRandomDossierApprenant({
            historique_statut_apprenant: historySequenceApprenti,
            annee_scolaire: "2021-2021",
            ...filters,
          })
        );
      }

      const date = new Date("2020-09-30T00:00:00.000+0000");
      const apprentisCountForAnneesScolaireList = await apprentis.getCountAtDate(date, filters);

      assert.equal(apprentisCountForAnneesScolaireList, 17);
    });

    it("gets right count of apprentis for edge case where historique is not sorted by date_statut", async () => {
      await dossiersApprenantsDb().insertOne(
        createRandomDossierApprenant({
          historique_statut_apprenant: [
            { valeur_statut: 3, date_statut: new Date("2025-10-01"), date_reception: new Date("2025-09-02") },
            { valeur_statut: 2, date_statut: new Date("2025-09-01"), date_reception: new Date("2025-10-02") },
          ],
          annee_scolaire: "2025-2026",
        })
      );

      const date = new Date("2025-10-01");
      const apprentisCountForAnneesScolaireList = await apprentis.getCountAtDate(date, {
        annee_scolaire: "2025-2026",
      });

      assert.equal(apprentisCountForAnneesScolaireList, 1);
    });

    it("gets right count of apprentis for edge case where multiple elements have the same date_statut but different date_reception", async () => {
      const sameDateStatut = new Date("2025-09-01");
      await dossiersApprenantsDb().insertOne(
        createRandomDossierApprenant({
          historique_statut_apprenant: [
            { valeur_statut: 3, date_statut: sameDateStatut, date_reception: new Date("2025-09-30") },
            { valeur_statut: 2, date_statut: sameDateStatut, date_reception: new Date("2025-09-15") },
          ],
          annee_scolaire: "2025-2026",
        })
      );

      const date = new Date("2025-10-01");
      const apprentisCountForAnneesScolaireList = await apprentis.getCountAtDate(date, {
        annee_scolaire: "2025-2026",
      });

      assert.equal(apprentisCountForAnneesScolaireList, 1);
    });

    it("gets right count of apprentis for edge case where multiple elements have the same date_statut but different date_reception (other case, no apprenti)", async () => {
      const sameDateStatut = new Date("2025-09-01");
      await dossiersApprenantsDb().insertOne(
        createRandomDossierApprenant({
          historique_statut_apprenant: [
            { valeur_statut: 3, date_statut: sameDateStatut, date_reception: new Date("2025-08-30") },
            { valeur_statut: 2, date_statut: sameDateStatut, date_reception: new Date("2025-09-15") },
          ],
          annee_scolaire: "2025-2026",
        })
      );

      const date = new Date("2025-10-01");
      const apprentisCountForAnneesScolaireList = await apprentis.getCountAtDate(date, {
        annee_scolaire: "2025-2026",
      });

      assert.equal(apprentisCountForAnneesScolaireList, 0);
    });
  });

  describe("Apprentis - getListAtDate", () => {
    it("gets list of apprentis at one date", async () => {
      await seedDossiersApprenants();

      const date = new Date("2020-09-15T00:00:00.000+0000");
      const apprentisList = await apprentis.getListAtDate(date);

      assert.equal(apprentisList.length, 5);
    });

    it("gets list of apprentis at another date", async () => {
      await seedDossiersApprenants();

      const date = new Date("2020-09-30T00:00:00.000+0000");
      const apprentisList = await apprentis.getListAtDate(date);

      assert.equal(apprentisList.length, 15);
    });

    it("gets list of apprentis at yet another date - check projection fields", async () => {
      await seedDossiersApprenants();

      const date = new Date("2020-10-10T00:00:00.000+0000");
      const projection = {
        uai_etablissement: 1,
        nom_etablissement: 1,
        formation_cfd: 1,
        annee_scolaire: 1,
      };
      const apprentisList = await apprentis.getListAtDate(date, {}, { projection });

      assert.equal(apprentisList.length, 5);
      for (let index = 0; index < apprentisList.length; index++) {
        assert.equal(apprentisList[index].uai_etablissement !== undefined, true);
        assert.equal(apprentisList[index].nom_etablissement !== undefined, true);
        assert.equal(apprentisList[index].formation_cfd !== undefined, true);
        assert.equal(apprentisList[index].annee_scolaire !== undefined, true);
      }
    });

    it("gets list of apprentis at a date when there was no data", async () => {
      await seedDossiersApprenants();

      const date = new Date("2010-10-10T00:00:00.000+0000");
      const apprentisList = await apprentis.getListAtDate(date);

      assert.equal(apprentisList.length, 0);
    });

    it("gets list of apprentis at a date and for a region", async () => {
      const filters = { etablissement_num_region: "28" };
      await seedDossiersApprenants(filters);

      const date = new Date("2020-09-30T00:00:00.000+0000");
      const apprentisListForRegion = await apprentis.getListAtDate(date, filters);

      assert.equal(apprentisListForRegion.length, 15);

      const apprentisLengthForAnotherRegion = await apprentis.getListAtDate(date, {
        etablissement_num_region: "100",
      });
      assert.equal(apprentisLengthForAnotherRegion.length, 0);
    });

    it("gets list of apprentis at a date and for a departement", async () => {
      const filters = { etablissement_num_departement: "75" };
      await seedDossiersApprenants(filters);

      const date = new Date("2020-09-30T00:00:00.000+0000");
      const apprentisListForDepartement = await apprentis.getListAtDate(date, filters);

      assert.equal(apprentisListForDepartement.length, 15);

      const apprentisListForAnotherDepartement = await apprentis.getListAtDate(date, {
        etablissement_num_departement: "100",
      });
      assert.equal(apprentisListForAnotherDepartement.length, 0);
    });

    it("gets list of apprentis at a date and for a siret_etablissement", async () => {
      const filters = { siret_etablissement: "77929544300013" };
      await seedDossiersApprenants(filters);

      const date = new Date("2020-09-30T00:00:00.000+0000");
      const apprentisLengthForSiret = await apprentis.getListAtDate(date, filters);

      assert.equal(apprentisLengthForSiret.length, 15);

      const apprentisLengthForAnotherSiret = await apprentis.getListAtDate(date, {
        siret_etablissement: "77929544300099",
      });
      assert.equal(apprentisLengthForAnotherSiret.length, 0);
    });

    it("gets list of apprentis at a date and for a formation_cfd", async () => {
      const filters = { formation_cfd: "2502000D" };
      await seedDossiersApprenants(filters);

      const date = new Date("2020-09-30T00:00:00.000+0000");
      const apprentisListForCfd = await apprentis.getListAtDate(date, filters);

      assert.equal(apprentisListForCfd.length, 15);

      const apprentisListForAnotherCfd = await apprentis.getListAtDate(date, { formation_cfd: "2502000X" });
      assert.equal(apprentisListForAnotherCfd.length, 0);
    });

    it("gets list of apprentis at a date and for a reseau", async () => {
      const filters = { etablissement_reseaux: RESEAUX_CFAS.BTP_CFA.nomReseau };
      await seedDossiersApprenants(filters);

      const date = new Date("2020-09-30T00:00:00.000+0000");
      const apprentisListForReseau = await apprentis.getListAtDate(date, filters);

      assert.equal(apprentisListForReseau.length, 15);

      const apprentisListForAnotherReseau = await apprentis.getListAtDate(date, {
        etablissement_reseaux: "inconnu",
      });
      assert.equal(apprentisListForAnotherReseau.length, 0);
    });
  });
});
