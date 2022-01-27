const assert = require("assert").strict;
const httpTests = require("../../utils/httpTests");
const users = require("../../../src/common/components/users");
const { apiRoles } = require("../../../src/common/roles");
const { RcoStatutCandidatModel, JobEventModel } = require("../../../src/common/model");
const { createRandomRcoStatutCandidat } = require("../../data/randomizedSample");
const { jobNames, jobEventStatuts, effectifsIndicators } = require("../../../src/common/model/constants");

const user = { name: "rcoUser", password: "password" };

const createApiUser = async () => {
  const { createUser } = await users();

  return await createUser(user.name, user.password, {
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

httpTests(__filename, ({ startServer }) => {
  describe("GET rco/test", () => {
    it("Vérifie que la route rco/test fonctionne avec un jeton JWT", async () => {
      const { httpClient } = await startServer();
      await createApiUser();
      const accessToken = await getJwtForUser(httpClient);

      // Call Api Route
      const response = await httpClient.get("/api/rco/test", { headers: { Authorization: `Bearer ${accessToken}` } });

      // Check Api Route data
      assert.deepEqual(response.status, 200);
      assert.deepEqual(response.data.msg, "ok");
    });
  });

  describe("GET rco/statutsCandidats.ndjson", () => {
    it("Vérifie qu'on peut récupérer les statuts RCO en ndjson si le Job RCO est terminé", async () => {
      const { httpClient } = await startServer();
      await createApiUser();
      const accessToken = await getJwtForUser(httpClient);

      const uaiTest = "0152290X";

      // Add ended Job Event
      await new JobEventModel({
        jobname: jobNames.createRcoStatutsCollection,
        action: jobEventStatuts.ended,
      }).save();

      for (let index = 0; index < 10; index++) {
        await new RcoStatutCandidatModel({
          ...createRandomRcoStatutCandidat(),
          uai_etablissement: uaiTest,
        }).save();
      }

      // Call Api Route
      const response = await httpClient.get("/api/rco/statutsCandidats.ndjson?limit=2", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // Check Api Route data
      assert.deepEqual(response.status, 200);
      let rcoStatutsCandidatsReceived = response.data.split("\n").filter((e) => e);
      assert.strictEqual(rcoStatutsCandidatsReceived.length, 2);
    });

    it("Vérifie qu'on ne peut pas récupérer les statuts RCO en ndjson lorsque le Job RCO n'est pas terminé", async () => {
      const { httpClient } = await startServer();
      await createApiUser();
      const accessToken = await getJwtForUser(httpClient);

      const uaiTest = "0152290X";

      // Add ended Job Event
      await new JobEventModel({
        jobname: jobNames.createRcoStatutsCollection,
        action: jobEventStatuts.started,
      }).save();

      for (let index = 0; index < 10; index++) {
        await new RcoStatutCandidatModel({
          ...createRandomRcoStatutCandidat(),
          uai_etablissement: uaiTest,
        }).save();
      }

      // Call Api Route
      const response = await httpClient.get("/api/rco/statutsCandidats.ndjson?limit=2", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // Check Api Route data
      assert.deepEqual(response.status, 501);
    });

    it("Vérifie qu'on peut récupérer les statuts RCO en ndjson avec tous les champs optionnels remplis", async () => {
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
        jobname: jobNames.createRcoStatutsCollection,
        action: jobEventStatuts.ended,
      }).save();

      for (let index = 0; index < 10; index++) {
        await new RcoStatutCandidatModel({
          ...createRandomRcoStatutCandidat(),
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
      const response = await httpClient.get("/api/rco/statutsCandidats.ndjson?limit=2", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // Check Api Route data
      assert.deepEqual(response.status, 200);
      let rcoStatutsCandidatsReceived = response.data.split("\n").filter((e) => e);
      assert.strictEqual(rcoStatutsCandidatsReceived.length, 2);
      assert.strictEqual(
        JSON.parse(rcoStatutsCandidatsReceived[0]).etablissement_formateur_code_commune_insee,
        etablissement_formateur_code_commune_inseeTest
      );
      assert.strictEqual(
        JSON.parse(rcoStatutsCandidatsReceived[0]).etablissement_code_postal,
        etablissement_code_postalTest
      );
      assert.strictEqual(
        JSON.stringify(JSON.parse(rcoStatutsCandidatsReceived[0]).periode_formation),
        JSON.stringify(periode_formationTest)
      );
      assert.strictEqual(
        JSON.parse(rcoStatutsCandidatsReceived[0]).code_commune_insee_apprenant,
        code_commune_insee_apprenantTest
      );
      assert.strictEqual(
        JSON.stringify(JSON.parse(rcoStatutsCandidatsReceived[0]).date_de_naissance_apprenant),
        JSON.stringify(date_de_naissance_apprenantTest)
      );
      assert.strictEqual(
        JSON.stringify(JSON.parse(rcoStatutsCandidatsReceived[0]).contrat_date_debut),
        JSON.stringify(contrat_date_debutTest)
      );
      assert.strictEqual(
        JSON.stringify(JSON.parse(rcoStatutsCandidatsReceived[0]).contrat_date_fin),
        JSON.stringify(contrat_date_finTest)
      );
      assert.strictEqual(
        JSON.stringify(JSON.parse(rcoStatutsCandidatsReceived[0]).contrat_date_rupture),
        JSON.stringify(contrat_date_ruptureTest)
      );
      assert.strictEqual(JSON.parse(rcoStatutsCandidatsReceived[0]).formation_rncp, formation_rncpTest);
    });

    it("Vérifie qu'on peut récupérer les statuts RCO en ndjson avec des champs effectifs_indicateurs différents", async () => {
      const { httpClient } = await startServer();
      await createApiUser();
      const accessToken = await getJwtForUser(httpClient);

      // Add ended Job Event
      await new JobEventModel({
        jobname: jobNames.createRcoStatutsCollection,
        action: jobEventStatuts.ended,
      }).save();

      await new RcoStatutCandidatModel({
        ...createRandomRcoStatutCandidat(),
        statut_calcule: effectifsIndicators.apprentis,
      }).save();

      await new RcoStatutCandidatModel({
        ...createRandomRcoStatutCandidat(),
        statut_calcule: effectifsIndicators.inscritsSansContrats,
      }).save();

      // Call Api Route
      const response = await httpClient.get("/api/rco/statutsCandidats.ndjson?limit=10", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // Check Api Route data
      assert.deepEqual(response.status, 200);
      let rcoStatutsCandidatsReceived = response.data.split("\n").filter((e) => e);
      assert.strictEqual(rcoStatutsCandidatsReceived.length, 2);
      assert.strictEqual(JSON.parse(rcoStatutsCandidatsReceived[0]).statut_calcule, effectifsIndicators.apprentis);
      assert.strictEqual(
        JSON.parse(rcoStatutsCandidatsReceived[1]).statut_calcule,
        effectifsIndicators.inscritsSansContrats
      );
    });
  });
});
