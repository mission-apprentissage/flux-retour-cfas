const assert = require("assert").strict;
const { createRandomDossierApprenant } = require("../../../data/randomizedSample");

const { CODES_STATUT_APPRENANT } = require("../../../../src/common/constants/dossierApprenantConstants");
const { DossierApprenantModel } = require("../../../../src/common/model");
const { EffectifsInscritsSansContrats } = require("../../../../src/common/components/effectifs/inscrits-sans-contrats");

describe(__filename, () => {
  const inscritsSansContrats = new EffectifsInscritsSansContrats();

  beforeEach(async () => {
    const statuts = [
      // rupturant, should not be counted
      createRandomDossierApprenant({
        etablissement_num_region: "199",
        historique_statut_apprenant: [
          { valeur_statut: CODES_STATUT_APPRENANT.apprenti, date_statut: new Date("2020-09-13T00:00:00") },
          { valeur_statut: CODES_STATUT_APPRENANT.inscrit, date_statut: new Date("2020-10-01T00:00:00") },
        ],
      }),
      createRandomDossierApprenant({
        historique_statut_apprenant: [
          { valeur_statut: CODES_STATUT_APPRENANT.inscrit, date_statut: new Date("2020-10-03T00:00:00") },
        ],
      }),
      createRandomDossierApprenant({
        etablissement_num_region: "199",
        historique_statut_apprenant: [
          { valeur_statut: CODES_STATUT_APPRENANT.inscrit, date_statut: new Date("2020-09-01T00:00:00") },
        ],
      }),
      createRandomDossierApprenant({
        etablissement_num_region: "199",
        historique_statut_apprenant: [],
      }),
      createRandomDossierApprenant({
        historique_statut_apprenant: [
          { valeur_statut: CODES_STATUT_APPRENANT.inscrit, date_statut: new Date("2020-03-22T00:00:00") },
        ],
      }),
      createRandomDossierApprenant({
        historique_statut_apprenant: [
          { valeur_statut: CODES_STATUT_APPRENANT.apprenti, date_statut: new Date("2020-03-22T00:00:00") },
        ],
      }),
      createRandomDossierApprenant({
        historique_statut_apprenant: [
          { valeur_statut: CODES_STATUT_APPRENANT.abandon, date_statut: new Date("2020-03-25T00:00:00") },
        ],
      }),
      createRandomDossierApprenant({
        historique_statut_apprenant: [
          { valeur_statut: CODES_STATUT_APPRENANT.inscrit, date_statut: new Date("2020-09-24T00:00:00") },
          { valeur_statut: CODES_STATUT_APPRENANT.apprenti, date_statut: new Date("2020-10-30T00:00:00") },
        ],
      }),
      createRandomDossierApprenant({
        historique_statut_apprenant: [
          { valeur_statut: CODES_STATUT_APPRENANT.inscrit, date_statut: new Date("2020-09-24T00:00:00") },
          { valeur_statut: CODES_STATUT_APPRENANT.apprenti, date_statut: new Date("2020-11-30T00:00:00") },
          { valeur_statut: CODES_STATUT_APPRENANT.inscrit, date_statut: new Date("2020-12-30T00:00:00") },
        ],
      }),
    ];
    for (let index = 0; index < statuts.length; index++) {
      const toAdd = new DossierApprenantModel(statuts[index]);
      await toAdd.save();
    }
  });

  describe("Inscrits sans contrats - getCountAtDate", () => {
    it("gets count of inscrits sans contrat at date", async () => {
      const date = new Date("2020-10-10T00:00:00");
      const count = await inscritsSansContrats.getCountAtDate(date);
      assert.equal(count, 5);
    });

    it("gets count of inscrits sans contrat now", async () => {
      const date = new Date();
      const count = await inscritsSansContrats.getCountAtDate(date);
      assert.equal(count, 3);
    });

    it("gets count of rupturants now with additional filter", async () => {
      const date = new Date();
      const count = await inscritsSansContrats.getCountAtDate(date, { etablissement_num_region: "199" });
      assert.equal(count, 1);
    });

    it("gets count of inscrits sans contrat at a date and for annee scolaire on same year and annee scolaire on two years", async () => {
      const filters = { uai_etablissement: "0670141P" };

      // Add 5 statuts inscrits sans contrat for annee_scolaire on same year
      for (let index = 0; index < 5; index++) {
        await new DossierApprenantModel(
          createRandomDossierApprenant({
            historique_statut_apprenant: [
              { valeur_statut: CODES_STATUT_APPRENANT.inscrit, date_statut: new Date("2020-09-01T00:00:00") },
            ],
            annee_scolaire: "2020-2020",
            ...filters,
          })
        ).save();
      }

      // Add 12 statuts inscrits sans contrat for annee_scolaire on two years
      for (let index = 0; index < 12; index++) {
        await new DossierApprenantModel(
          createRandomDossierApprenant({
            historique_statut_apprenant: [
              { valeur_statut: CODES_STATUT_APPRENANT.inscrit, date_statut: new Date("2020-09-01T00:00:00") },
            ],
            annee_scolaire: "2021-2021",
            ...filters,
          })
        ).save();
      }

      const date = new Date("2020-10-10T00:00:00");
      const abandonsCountForAnneesScolaireList = await inscritsSansContrats.getCountAtDate(date, filters);

      assert.equal(abandonsCountForAnneesScolaireList, 17);
    });
  });

  describe("Inscrits sans contrats - getListAtDate", () => {
    it("gets list of inscrits sans contrat at date", async () => {
      const date = new Date("2020-10-10T00:00:00");
      const list = await inscritsSansContrats.getListAtDate(date);
      assert.equal(list.length, 5);
    });

    it("gets list of inscrits sans contrat now - check projection fields", async () => {
      const date = new Date();
      const projection = {
        uai_etablissement: 1,
        nom_etablissement: 1,
        formation_cfd: 1,
        annee_scolaire: 1,
      };
      const list = await inscritsSansContrats.getListAtDate(date, {}, { projection });
      assert.equal(list.length, 3);
      for (let index = 0; index < list.length; index++) {
        assert.equal(list[index].uai_etablissement !== undefined, true);
        assert.equal(list[index].nom_etablissement !== undefined, true);
        assert.equal(list[index].formation_cfd !== undefined, true);
        assert.equal(list[index].annee_scolaire !== undefined, true);
      }
    });

    it("gets list of rupturants now with additional filter", async () => {
      const date = new Date();
      const list = await inscritsSansContrats.getListAtDate(date, { etablissement_num_region: "199" });
      assert.equal(list.length, 1);
    });
  });
});
