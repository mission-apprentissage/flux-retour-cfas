const assert = require("assert").strict;
const { startServer } = require("../../../utils/testUtils");
const { PARTAGE_SIMPLIFIE_ROLES } = require("../../../../src/common/roles.js");
const { dbCollection } = require("../../../../src/common/mongodb.js");
const { COLLECTIONS_NAMES } = require("../../../../src/common/model/collections.js");
const { USER_EVENTS_ACTIONS, USER_EVENTS_TYPES } = require("../../../../src/common/constants/userEventsConstants.js");

describe("API Route Register", () => {
  it("Vérifie qu'on peut s'inscrire en fournissant tous les champs obligatoires", async () => {
    const { httpClient } = await startServer();

    const testEmail = "testCfa@test.fr";
    const testUai = "0000000X";
    const testSiret = "19921500500018";
    const testNom = "MBAPPE";
    const testPrenom = "Kylian";
    const testFonction = "Directeur";
    const testRegion = "Ma région";

    const response = await httpClient.post("/api/partage-simplifie/register", {
      email: testEmail,
      uai: testUai,
      siret: testSiret,
      nom: testNom,
      prenom: testPrenom,
      fonction: testFonction,
      region: testRegion,
    });

    const foundInDb = await dbCollection(COLLECTIONS_NAMES.PsUsers).findOne({ email: testEmail });

    assert.equal(response.status, 200);
    assert.equal(response.data?.message, "success");
    assert.equal(foundInDb.email === testEmail, true);
    assert.equal(foundInDb.uai === testUai, true);
    assert.equal(foundInDb.siret === testSiret, true);
    assert.equal(foundInDb.nom === testNom, true);
    assert.equal(foundInDb.prenom === testPrenom, true);
    assert.equal(foundInDb.fonction === testFonction, true);
    assert.equal(foundInDb.region === testRegion, true);
    assert.equal(foundInDb.role === PARTAGE_SIMPLIFIE_ROLES.OF, true);

    const userEventFoundInDb = await dbCollection(COLLECTIONS_NAMES.UserEvents).findOne({ username: testEmail });
    assert.equal(userEventFoundInDb.type === USER_EVENTS_TYPES.POST, true);
    assert.equal(userEventFoundInDb.action === USER_EVENTS_ACTIONS.REGISTER, true);
  });

  it("Vérifie qu'on peut s'inscrire en fournissant tous les champs optionnels", async () => {
    const { httpClient } = await startServer();

    const testEmail = "testCfa@test.fr";
    const testUai = "0000000X";
    const testSiret = "19921500500018";
    const testNom = "MBAPPE";
    const testPrenom = "Kylian";
    const testFonction = "Directeur";
    const testRegion = "Centre Val de Loire";
    const testTelephone = "0100224488";
    const testOutilsGestion = ["outil1", "outil2"];
    const testNomEtablissement = "Etablissement de test";
    const testAdresseEtablissement = "Adresse Etablissement de test";

    const response = await httpClient.post("/api/partage-simplifie/register", {
      email: testEmail,
      uai: testUai,
      siret: testSiret,
      nom: testNom,
      nom_etablissement: testNomEtablissement,
      adresse_etablissement: testAdresseEtablissement,
      prenom: testPrenom,
      fonction: testFonction,
      region: testRegion,
      telephone: testTelephone,
      outils_gestion: testOutilsGestion,
    });

    const foundInDb = await dbCollection(COLLECTIONS_NAMES.PsUsers).findOne({ email: testEmail });

    assert.equal(response.status, 200);
    assert.equal(response.data?.message, "success");
    assert.equal(foundInDb.email === testEmail, true);
    assert.equal(foundInDb.uai === testUai, true);
    assert.equal(foundInDb.siret === testSiret, true);
    assert.equal(foundInDb.nom === testNom, true);
    assert.equal(foundInDb.nom_etablissement === testNomEtablissement, true);
    assert.equal(foundInDb.adresse_etablissement === testAdresseEtablissement, true);
    assert.equal(foundInDb.prenom === testPrenom, true);
    assert.equal(foundInDb.fonction === testFonction, true);
    assert.equal(foundInDb.role === PARTAGE_SIMPLIFIE_ROLES.OF, true);
    assert.equal(foundInDb.region === testRegion, true);
    assert.equal(foundInDb.telephone === testTelephone, true);
    assert.deepEqual(foundInDb.outils_gestion, testOutilsGestion);

    const userEventFoundInDb = await dbCollection(COLLECTIONS_NAMES.UserEvents).findOne({ username: testEmail });
    assert.equal(userEventFoundInDb.type === USER_EVENTS_TYPES.POST, true);
    assert.equal(userEventFoundInDb.action === USER_EVENTS_ACTIONS.REGISTER, true);
  });

  it("Vérifie qu'on ne peut s'inscrire si l'email est manquant", async () => {
    const { httpClient } = await startServer();

    const testUai = "0000000X";
    const testSiret = "19921500500018";
    const testNom = "MBAPPE";
    const testPrenom = "Kylian";
    const testFonction = "Directeur";
    const testRegion = "Ma région";

    const response = await httpClient.post("/api/partage-simplifie/register", {
      uai: testUai,
      siret: testSiret,
      nom: testNom,
      prenom: testPrenom,
      fonction: testFonction,
      region: testRegion,
    });

    assert.equal(response.status, 400);
  });

  it("Vérifie qu'on ne peut s'inscrire si l'email est au mauvais format", async () => {
    const { httpClient } = await startServer();

    const testEmail = 123;
    const testUai = "0000000X";
    const testSiret = "19921500500018";
    const testNom = "MBAPPE";
    const testPrenom = "Kylian";
    const testFonction = "Directeur";
    const testRegion = "Ma région";

    const response = await httpClient.post("/api/partage-simplifie/register", {
      email: testEmail,
      uai: testUai,
      siret: testSiret,
      nom: testNom,
      prenom: testPrenom,
      fonction: testFonction,
      region: testRegion,
    });

    assert.equal(response.status, 400);
  });

  it("Vérifie qu'on ne peut s'inscrire si l'uai est manquant", async () => {
    const { httpClient } = await startServer();

    const testEmail = "testCfa@test.fr";
    const testSiret = "19921500500018";
    const testNom = "MBAPPE";
    const testPrenom = "Kylian";
    const testFonction = "Directeur";
    const testRegion = "Ma région";

    const response = await httpClient.post("/api/partage-simplifie/register", {
      email: testEmail,
      siret: testSiret,
      nom: testNom,
      prenom: testPrenom,
      fonction: testFonction,
      region: testRegion,
    });

    assert.equal(response.status, 400);
  });

  it("Vérifie qu'on ne peut s'inscrire si l'uai est au mauvais format", async () => {
    const { httpClient } = await startServer();

    const testEmail = "testCfa@test.fr";
    const testUai = 123;
    const testSiret = "19921500500018";
    const testNom = "MBAPPE";
    const testPrenom = "Kylian";
    const testFonction = "Directeur";
    const testRegion = "Ma région";

    const response = await httpClient.post("/api/partage-simplifie/register", {
      email: testEmail,
      uai: testUai,
      siret: testSiret,
      nom: testNom,
      prenom: testPrenom,
      fonction: testFonction,
      region: testRegion,
    });

    assert.equal(response.status, 400);
  });

  it("Vérifie qu'on ne peut s'inscrire si le siret est manquant", async () => {
    const { httpClient } = await startServer();

    const testEmail = "testCfa@test.fr";
    const testUai = "0000000X";
    const testNom = "MBAPPE";
    const testPrenom = "Kylian";
    const testFonction = "Directeur";
    const testRegion = "Ma région";

    const response = await httpClient.post("/api/partage-simplifie/register", {
      email: testEmail,
      uai: testUai,
      nom: testNom,
      prenom: testPrenom,
      fonction: testFonction,
      region: testRegion,
    });

    assert.equal(response.status, 400);
  });

  it("Vérifie qu'on ne peut s'inscrire si le siret est au mauvais format", async () => {
    const { httpClient } = await startServer();

    const testEmail = "testCfa@test.fr";
    const testUai = "0000000X";
    const testSiret = 123;
    const testNom = "MBAPPE";
    const testPrenom = "Kylian";
    const testFonction = "Directeur";
    const testRegion = "Ma région";

    const response = await httpClient.post("/api/partage-simplifie/register", {
      email: testEmail,
      uai: testUai,
      siret: testSiret,
      nom: testNom,
      prenom: testPrenom,
      fonction: testFonction,
      region: testRegion,
    });

    assert.equal(response.status, 400);
  });

  it("Vérifie qu'on ne peut s'inscrire si le nom est manquant", async () => {
    const { httpClient } = await startServer();

    const testEmail = "testCfa@test.fr";
    const testUai = "0000000X";
    const testSiret = "19921500500018";
    const testPrenom = "Kylian";
    const testFonction = "Directeur";
    const testRegion = "Ma région";

    const response = await httpClient.post("/api/partage-simplifie/register", {
      email: testEmail,
      uai: testUai,
      siret: testSiret,
      prenom: testPrenom,
      fonction: testFonction,
      region: testRegion,
    });

    assert.equal(response.status, 400);
  });

  it("Vérifie qu'on ne peut s'inscrire si le nom est au mauvais format", async () => {
    const { httpClient } = await startServer();

    const testEmail = "testCfa@test.fr";
    const testUai = "0000000X";
    const testSiret = "19921500500018";
    const testNom = 123;
    const testPrenom = "Kylian";
    const testFonction = "Directeur";
    const testRegion = "Ma région";

    const response = await httpClient.post("/api/partage-simplifie/register", {
      email: testEmail,
      uai: testUai,
      siret: testSiret,
      nom: testNom,
      prenom: testPrenom,
      fonction: testFonction,
      region: testRegion,
    });

    assert.equal(response.status, 400);
  });

  it("Vérifie qu'on ne peut s'inscrire si le nom d'établissement est au mauvais format", async () => {
    const { httpClient } = await startServer();

    const testEmail = "testCfa@test.fr";
    const testUai = "0000000X";
    const testSiret = "19921500500018";
    const testNom = "NOM";
    const testNomEtablissement = 123;
    const testPrenom = "Kylian";
    const testFonction = "Directeur";
    const testRegion = "Ma région";

    const response = await httpClient.post("/api/partage-simplifie/register", {
      email: testEmail,
      uai: testUai,
      siret: testSiret,
      nom: testNom,
      nom_etablissement: testNomEtablissement,
      prenom: testPrenom,
      fonction: testFonction,
      region: testRegion,
    });

    assert.equal(response.status, 400);
  });

  it("Vérifie qu'on ne peut s'inscrire si l'adresse d'établissement est au mauvais format", async () => {
    const { httpClient } = await startServer();

    const testEmail = "testCfa@test.fr";
    const testUai = "0000000X";
    const testSiret = "19921500500018";
    const testNom = "NOM";
    const testAdresseEtablissement = 123;
    const testPrenom = "Kylian";
    const testFonction = "Directeur";
    const testRegion = "Ma région";

    const response = await httpClient.post("/api/partage-simplifie/register", {
      email: testEmail,
      uai: testUai,
      siret: testSiret,
      nom: testNom,
      adresse_etablissement: testAdresseEtablissement,
      prenom: testPrenom,
      fonction: testFonction,
      region: testRegion,
    });

    assert.equal(response.status, 400);
  });

  it("Vérifie qu'on ne peut s'inscrire si le prénom est manquant", async () => {
    const { httpClient } = await startServer();

    const testEmail = "testCfa@test.fr";
    const testUai = "0000000X";
    const testSiret = "19921500500018";
    const testNom = "MBAPPE";
    const testFonction = "Directeur";
    const testRegion = "Ma région";

    const response = await httpClient.post("/api/partage-simplifie/register", {
      email: testEmail,
      uai: testUai,
      siret: testSiret,
      nom: testNom,
      fonction: testFonction,
      region: testRegion,
    });

    assert.equal(response.status, 400);
  });

  it("Vérifie qu'on ne peut s'inscrire si le prénom est au mauvais format", async () => {
    const { httpClient } = await startServer();

    const testEmail = "testCfa@test.fr";
    const testUai = "0000000X";
    const testSiret = "19921500500018";
    const testNom = "MBAPPE";
    const testPrenom = 123;
    const testFonction = "Directeur";
    const testRegion = "Ma région";

    const response = await httpClient.post("/api/partage-simplifie/register", {
      email: testEmail,
      uai: testUai,
      siret: testSiret,
      nom: testNom,
      prenom: testPrenom,
      fonction: testFonction,
      region: testRegion,
    });

    assert.equal(response.status, 400);
  });

  it("Vérifie qu'on ne peut s'inscrire si la fonction est manquante", async () => {
    const { httpClient } = await startServer();

    const testEmail = "testCfa@test.fr";
    const testUai = "0000000X";
    const testSiret = "19921500500018";
    const testNom = "MBAPPE";
    const testPrenom = "Kylian";
    const testRegion = "Ma région";

    const response = await httpClient.post("/api/partage-simplifie/register", {
      email: testEmail,
      uai: testUai,
      siret: testSiret,
      nom: testNom,
      prenom: testPrenom,
      region: testRegion,
    });

    assert.equal(response.status, 400);
  });

  it("Vérifie qu'on ne peut s'inscrire si la fonction est au mauvais format", async () => {
    const { httpClient } = await startServer();

    const testEmail = "testCfa@test.fr";
    const testUai = "0000000X";
    const testSiret = "19921500500018";
    const testNom = "MBAPPE";
    const testPrenom = "Kylian";
    const testFonction = 123;
    const testRegion = "Ma région";

    const response = await httpClient.post("/api/partage-simplifie/register", {
      email: testEmail,
      uai: testUai,
      siret: testSiret,
      nom: testNom,
      prenom: testPrenom,
      fonction: testFonction,
      region: testRegion,
    });

    assert.equal(response.status, 400);
  });

  it("Vérifie qu'on ne peut s'inscrire si la région est au mauvais format", async () => {
    const { httpClient } = await startServer();

    const testEmail = "testCfa@test.fr";
    const testUai = "0000000X";
    const testSiret = "19921500500018";
    const testNom = "MBAPPE";
    const testPrenom = "Kylian";
    const testFonction = "Directeur";
    const testRegion = 123;

    const response = await httpClient.post("/api/partage-simplifie/register", {
      email: testEmail,
      uai: testUai,
      siret: testSiret,
      nom: testNom,
      prenom: testPrenom,
      fonction: testFonction,
      region: testRegion,
    });

    assert.equal(response.status, 400);
  });

  it("Vérifie qu'on ne peut s'inscrire si la région est manquante", async () => {
    const { httpClient } = await startServer();

    const testEmail = "testCfa@test.fr";
    const testUai = "0000000X";
    const testSiret = "19921500500018";
    const testNom = "MBAPPE";
    const testPrenom = "Kylian";

    const response = await httpClient.post("/api/partage-simplifie/register", {
      email: testEmail,
      uai: testUai,
      siret: testSiret,
      nom: testNom,
      prenom: testPrenom,
    });

    assert.equal(response.status, 400);
  });

  it("Vérifie qu'on ne peut s'inscrire si le téléphone est au mauvais format", async () => {
    const { httpClient } = await startServer();

    const testEmail = "testCfa@test.fr";
    const testUai = "0000000X";
    const testSiret = "19921500500018";
    const testNom = "MBAPPE";
    const testPrenom = "Kylian";
    const testFonction = "Directeur";
    const testTelephone = 123;
    const testRegion = "Ma région";

    const response = await httpClient.post("/api/partage-simplifie/register", {
      email: testEmail,
      uai: testUai,
      siret: testSiret,
      nom: testNom,
      prenom: testPrenom,
      fonction: testFonction,
      telephone: testTelephone,
      region: testRegion,
    });

    assert.equal(response.status, 400);
  });

  it("Vérifie qu'on ne peut s'inscrire si la liste des outils de gestion est au mauvais format", async () => {
    const { httpClient } = await startServer();

    const testEmail = "testCfa@test.fr";
    const testUai = "0000000X";
    const testSiret = "19921500500018";
    const testNom = "MBAPPE";
    const testPrenom = "Kylian";
    const testFonction = "Directeur";
    const testOutilsGestion = 123;
    const testRegion = "Ma région";

    const response = await httpClient.post("/api/partage-simplifie/register", {
      email: testEmail,
      uai: testUai,
      siret: testSiret,
      nom: testNom,
      prenom: testPrenom,
      fonction: testFonction,
      outils_gestion: testOutilsGestion,
      region: testRegion,
    });

    assert.equal(response.status, 400);
  });
});
