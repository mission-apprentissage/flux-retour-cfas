const assert = require("assert").strict;
const { createRandomStatutCandidat } = require("../../../data/randomizedSample");

const { StatutCandidatModel } = require("../../../../src/common/model");
const { CODES_STATUT_APPRENANT } = require("../../../../src/common/constants/statutsCandidatsConstants");
const { EffectifsInscritsSansContrats } = require("../../../../src/common/components/effectifs/inscrits-sans-contrats");

describe(__filename, () => {
  const inscritsSansContrats = new EffectifsInscritsSansContrats();

  beforeEach(async () => {
    const statuts = [
      // rupturant, should not be counted
      createRandomStatutCandidat({
        etablissement_num_region: "199",
        historique_statut_apprenant: [
          { valeur_statut: CODES_STATUT_APPRENANT.apprenti, date_statut: new Date("2020-09-13T00:00:00") },
          { valeur_statut: CODES_STATUT_APPRENANT.inscrit, date_statut: new Date("2020-10-01T00:00:00") },
        ],
      }),
      createRandomStatutCandidat({
        historique_statut_apprenant: [
          { valeur_statut: CODES_STATUT_APPRENANT.inscrit, date_statut: new Date("2020-10-03T00:00:00") },
        ],
      }),
      createRandomStatutCandidat({
        etablissement_num_region: "199",
        historique_statut_apprenant: [
          { valeur_statut: CODES_STATUT_APPRENANT.inscrit, date_statut: new Date("2020-09-01T00:00:00") },
        ],
      }),
      createRandomStatutCandidat({
        etablissement_num_region: "199",
        historique_statut_apprenant: [],
      }),
      createRandomStatutCandidat({
        historique_statut_apprenant: [
          { valeur_statut: CODES_STATUT_APPRENANT.inscrit, date_statut: new Date("2020-03-22T00:00:00") },
        ],
      }),
      createRandomStatutCandidat({
        historique_statut_apprenant: [
          { valeur_statut: CODES_STATUT_APPRENANT.apprenti, date_statut: new Date("2020-03-22T00:00:00") },
        ],
      }),
      createRandomStatutCandidat({
        historique_statut_apprenant: [
          { valeur_statut: CODES_STATUT_APPRENANT.abandon, date_statut: new Date("2020-03-25T00:00:00") },
        ],
      }),
      createRandomStatutCandidat({
        historique_statut_apprenant: [
          { valeur_statut: CODES_STATUT_APPRENANT.inscrit, date_statut: new Date("2020-09-24T00:00:00") },
          { valeur_statut: CODES_STATUT_APPRENANT.apprenti, date_statut: new Date("2020-10-30T00:00:00") },
        ],
      }),
      createRandomStatutCandidat({
        historique_statut_apprenant: [
          { valeur_statut: CODES_STATUT_APPRENANT.inscrit, date_statut: new Date("2020-09-24T00:00:00") },
          { valeur_statut: CODES_STATUT_APPRENANT.apprenti, date_statut: new Date("2020-11-30T00:00:00") },
          { valeur_statut: CODES_STATUT_APPRENANT.inscrit, date_statut: new Date("2020-12-30T00:00:00") },
        ],
      }),
    ];
    for (let index = 0; index < statuts.length; index++) {
      const toAdd = new StatutCandidatModel(statuts[index]);
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
