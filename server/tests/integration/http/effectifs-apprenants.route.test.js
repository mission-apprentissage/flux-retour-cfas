const assert = require("assert").strict;
const { startServer } = require("../../utils/testUtils");
const users = require("../../../src/common/components/users");
const { apiRoles } = require("../../../src/common/roles");
const { JOB_NAMES, jobEventStatuts } = require("../../../src/common/constants/jobsConstants");
const { EFFECTIF_INDICATOR_NAMES } = require("../../../src/common/constants/dossierApprenantConstants");
const { EffectifApprenantModel, JobEventModel } = require("../../../src/common/model");
const { createRandomEffectifApprenant } = require("../../data/randomizedSample");

const user = { name: "apiConsumerUser", password: "password" };

const createApiUser = async () => {
  const { createUser } = await users();

  return await createUser({
    username: user.name,
    password: user.password,
    permissions: [apiRoles.apiStatutsConsumer.anonymousDataConsumer],
  });
};

const getJwtForUser = async (httpClient) => {
  const { data } = await httpClient.post("/api/login", {
    username: user.name,
    password: user.password,
  });
  return data.access_token;
};

describe(__filename, () => {
  describe("GET effectifs-apprenants/test", () => {
    it("Vérifie que la route effectifs-apprenants/test fonctionne avec un jeton JWT", async () => {
      const { httpClient } = await startServer();
      await createApiUser();
      const accessToken = await getJwtForUser(httpClient);

      // Call Api Route
      const response = await httpClient.get("/api/effectifs-apprenants/test", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // Check Api Route data
      assert.deepEqual(response.status, 200);
      assert.deepEqual(response.data.msg, "ok");
    });
  });

  describe("GET effectifs-apprenants/", () => {
    it("Vérifie qu'on peut récupérer les effectifs apprenants si le Job est terminé", async () => {
      const { httpClient } = await startServer();
      await createApiUser();
      const accessToken = await getJwtForUser(httpClient);

      const uaiTest = "0152290X";

      // Add ended Job Event
      await new JobEventModel({
        jobname: JOB_NAMES.createEffectifsApprenantsCollection,
        action: jobEventStatuts.ended,
      }).save();

      for (let index = 0; index < 10; index++) {
        await new EffectifApprenantModel({
          ...createRandomEffectifApprenant(),
          uai_etablissement: uaiTest,
        }).save();
      }

      // Call Api Route
      const response = await httpClient.get("/api/effectifs-apprenants?limit=2", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // Check Api Route data
      assert.deepEqual(response.status, 200);
      assert.equal(response.data.effectifsApprenants.length, 2);
      assert.equal(response.data.pagination.page, 1);
      assert.equal(response.data.pagination.nombre_de_page, 5);
      assert.equal(response.data.pagination.total, 10);
    });

    it("Vérifie qu'on ne peut pas récupérer les effectifs apprenants lorsque le Job n'est pas terminé", async () => {
      const { httpClient } = await startServer();
      await createApiUser();
      const accessToken = await getJwtForUser(httpClient);

      const uaiTest = "0152290X";

      // Add ended Job Event
      await new JobEventModel({
        jobname: JOB_NAMES.createEffectifsApprenantsCollection,
        action: jobEventStatuts.started,
      }).save();

      for (let index = 0; index < 10; index++) {
        await new EffectifApprenantModel({
          ...createRandomEffectifApprenant(),
          uai_etablissement: uaiTest,
        }).save();
      }

      // Call Api Route
      const response = await httpClient.get("/api/effectifs-apprenants?limit=2", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // Check Api Route data
      assert.deepEqual(response.status, 501);
    });

    it("Vérifie qu'on peut récupérer les effectifs apprenants avec tous les champs optionnels remplis", async () => {
      const { httpClient } = await startServer();
      await createApiUser();
      const accessToken = await getJwtForUser(httpClient);

      const etablissement_formateur_code_commune_inseeTest = "75000";
      const etablissement_code_postalTest = "75013";
      const periode_formationTest = [2019, 2021];
      const code_commune_insee_apprenantTest = "77144";
      const date_de_naissance_apprenantTest = new Date("2000-01-13");
      const contrat_date_debutTest = new Date("2021-03-10");
      const contrat_date_finTest = new Date("2021-03-20");
      const contrat_date_ruptureTest = new Date("2021-03-15");
      const formation_rncpTest = "RNCP34945";

      // Add ended Job Event
      await new JobEventModel({
        jobname: JOB_NAMES.createEffectifsApprenantsCollection,
        action: jobEventStatuts.ended,
      }).save();

      for (let index = 0; index < 10; index++) {
        await new EffectifApprenantModel({
          ...createRandomEffectifApprenant(),
          etablissement_formateur_code_commune_insee: etablissement_formateur_code_commune_inseeTest,
          etablissement_code_postal: etablissement_code_postalTest,
          periode_formation: periode_formationTest,
          code_commune_insee_apprenant: code_commune_insee_apprenantTest,
          date_de_naissance_apprenant: date_de_naissance_apprenantTest,
          contrat_date_debut: contrat_date_debutTest,
          contrat_date_fin: contrat_date_finTest,
          contrat_date_rupture: contrat_date_ruptureTest,
          formation_rncp: formation_rncpTest,
        }).save();
      }

      // Call Api Route
      const response = await httpClient.get("/api/effectifs-apprenants?limit=2", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // Check Api Route data
      assert.deepEqual(response.status, 200);
      assert.equal(response.data.effectifsApprenants.length, 2);
      assert.equal(response.data.pagination.page, 1);
      assert.equal(response.data.pagination.nombre_de_page, 5);
      assert.equal(response.data.pagination.total, 10);
      assert.strictEqual(
        response.data.effectifsApprenants[0].etablissement_formateur_code_commune_insee,
        etablissement_formateur_code_commune_inseeTest
      );
      assert.strictEqual(response.data.effectifsApprenants[0].etablissement_code_postal, etablissement_code_postalTest);
      assert.strictEqual(response.data.effectifsApprenants[0].periode_formation.join(), periode_formationTest.join());
      assert.strictEqual(
        response.data.effectifsApprenants[0].code_commune_insee_apprenant,
        code_commune_insee_apprenantTest
      );
      assert.strictEqual(
        new Date(response.data.effectifsApprenants[0].date_de_naissance_apprenant).getTime(),
        date_de_naissance_apprenantTest.getTime()
      );
      assert.strictEqual(
        new Date(response.data.effectifsApprenants[0].contrat_date_debut).getTime(),
        contrat_date_debutTest.getTime()
      );
      assert.strictEqual(
        new Date(response.data.effectifsApprenants[0].contrat_date_fin).getTime(),
        contrat_date_finTest.getTime()
      );
      assert.strictEqual(
        new Date(response.data.effectifsApprenants[0].contrat_date_rupture).getTime(),
        contrat_date_ruptureTest.getTime()
      );
      assert.strictEqual(response.data.effectifsApprenants[0].formation_rncp, formation_rncpTest);
    });

    it("Vérifie qu'on peut récupérer les effectifs apprenants avec des champs indicateur_effectif différents", async () => {
      const { httpClient } = await startServer();
      await createApiUser();
      const accessToken = await getJwtForUser(httpClient);

      // Add ended Job Event
      await new JobEventModel({
        jobname: JOB_NAMES.createEffectifsApprenantsCollection,
        action: jobEventStatuts.ended,
      }).save();

      await new EffectifApprenantModel({
        ...createRandomEffectifApprenant(),
        indicateur_effectif: EFFECTIF_INDICATOR_NAMES.apprentis,
      }).save();

      await new EffectifApprenantModel({
        ...createRandomEffectifApprenant(),
        indicateur_effectif: EFFECTIF_INDICATOR_NAMES.inscritsSansContrats,
      }).save();

      // Call Api Route
      const response = await httpClient.get("/api/effectifs-apprenants?limit=10", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // Check Api Route data
      assert.deepEqual(response.status, 200);
      assert.equal(response.data.effectifsApprenants.length, 2);
      assert.equal(response.data.pagination.page, 1);
      assert.equal(response.data.pagination.nombre_de_page, 1);
      assert.equal(response.data.pagination.total, 2);
      assert.strictEqual(response.data.effectifsApprenants[0].indicateur_effectif, EFFECTIF_INDICATOR_NAMES.apprentis);
      assert.strictEqual(
        response.data.effectifsApprenants[1].indicateur_effectif,
        EFFECTIF_INDICATOR_NAMES.inscritsSansContrats
      );
    });
  });
});
