const config = require("../../../../config");
const { createPsUserToken } = require("../../../../src/common/utils/jwtUtils");
const jwt = require("jsonwebtoken");

const assert = require("assert").strict;

describe("createPsUserToken", () => {
  it("crée un token pour un utilisateur valide avec le bon JWT_SECRET", () => {
    const testRole = "testRole";
    const testEmail = "testEmail@test.fr";
    const testEtablissement = "testEtablissement";
    const testUai = "0000000X";
    const testSiret = "19921500500018";
    const testAdresse = "ISTELI Lille 12 rue de la paix 59100 LILLE";
    const testOutilsGestion = ["outil1", "outil2"];

    const user = {
      role: testRole,
      email: testEmail,
      nom_etablissement: testEtablissement,
      adresse_etablissement: testAdresse,
      uai: testUai,
      siret: testSiret,
      adresse: testAdresse,
      outils_gestion: testOutilsGestion,
    };

    const token = createPsUserToken(user);
    assert.equal(token !== null, true);
    const decoded = jwt.verify(token, config.auth.user.jwtSecret);
    assert.ok(decoded.iat);
    assert.ok(decoded.exp);
    assert.equal(decoded.sub === testEmail, true);
    assert.equal(decoded.iss === config.appName, true);
    assert.equal(decoded.role === testRole, true);
    assert.equal(decoded.nom_etablissement === testEtablissement, true);
    assert.equal(decoded.adresse_etablissement === testAdresse, true);
    assert.equal(decoded.uai === testUai, true);
    assert.equal(decoded.siret === testSiret, true);
    assert.deepEqual(decoded.outils_gestion, testOutilsGestion);
  });

  it("ne crée pas un token pour un utilisateur valide si le JWT_SECRET n'est pas bon", () => {
    const testRole = "testRole";
    const testEmail = "testEmail@test.fr";
    const testEtablissement = "testEtablissement";

    const user = {
      role: testRole,
      email: testEmail,
      nom_etablissement: testEtablissement,
    };

    const token = createPsUserToken(user);
    assert.equal(token !== null, true);
    assert.throws(() => jwt.verify(token, "BAD_SECRET"));
  });
});
