const assert = require("assert").strict;
// eslint-disable-next-line node/no-unpublished-require
const { startServer } = require("../../utils/testUtils");
const { apiRoles } = require("../../../src/common/roles");
const users = require("../../../src/common/components/users");

const user = { name: "apiConsumerUser", password: "password" };

const createApiUser = async () => {
  const { createUser } = await users();

  return await createUser({
    username: user.name,
    password: user.password,
    permissions: [apiRoles.administrator],
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
  describe("GET /reseaux-cfas", () => {
    it("sends a 200 HTTP response with list of reseaux cfas", async () => {
      const { httpClient, components } = await startServer();
      await createApiUser();
      const accessToken = await getJwtForUser(httpClient);

      const reseauCfa1 = { nom_reseau: "RESEAU_TEST_1", nom_etablissement: "Etablissement de test 1", uai: "0670141P" };
      const reseauCfa2 = { nom_reseau: "RESEAU_TEST_2", nom_etablissement: "Etablissement de test 2", uai: "0670141U" };
      await components.reseauxCfas.create(reseauCfa1);
      await components.reseauxCfas.create(reseauCfa2);

      const response = await httpClient.get("/api/reseaux-cfas", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      assert.equal(response.status, 200);
      assert.equal(response.data[0].nom_reseau, reseauCfa1.nom_reseau);
      assert.equal(response.data[0].nom_etablissement, reseauCfa1.nom_etablissement);
      assert.equal(response.data[0].uai, reseauCfa1.uai);
      assert.equal(response.data[1].nom_reseau, reseauCfa2.nom_reseau);
      assert.equal(response.data[1].nom_etablissement, reseauCfa2.nom_etablissement);
      assert.equal(response.data[1].uai, reseauCfa2.uai);
    });
  });
  describe("DELETE /reseaux-cfas/delete/:id", () => {
    it("Permet de supprimer un reseau de cfa", async () => {
      const { httpClient, components } = await startServer();
      await createApiUser();
      const accessToken = await getJwtForUser(httpClient);

      const reseauCfa1 = {
        id: "6266cd54a955765dd478f4e6",
        nom_reseau: "RESEAU_TEST_1",
        nom_etablissement: "Etablissement de test 1",
        uai: "0670141P",
      };

      await components.reseauxCfas.create(reseauCfa1);

      const response = await httpClient.delete(`/api/reseaux-cfas/delete/${reseauCfa1.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      assert.equal(response.status, 200);
    });
  });
});
