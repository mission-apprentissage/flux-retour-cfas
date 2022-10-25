const assert = require("assert").strict;
const { PARTAGE_SIMPLIFIE_ROLES } = require("../../../../src/common/roles.js");
const { PartageSimplifieUsersFactory } = require("../../../../src/common/factory/partageSimplifieUsersFactory.js");
const { generateRandomAlphanumericPhrase } = require("../../../../src/common/utils/miscUtils.js");

describe("Factory partageSimplifieUsersFactory", () => {
  describe("create", () => {
    it("Vérifie la création d'user via sa factory avec uniquement les champs obligatoires fournis", async () => {
      const testEmail = "user@email.fr";
      const testPassword = generateRandomAlphanumericPhrase(80);
      const testRole = PARTAGE_SIMPLIFIE_ROLES.OF;

      const entity = await PartageSimplifieUsersFactory.create({
        email: testEmail,
        password: testPassword,
        role: testRole,
      });

      assert.equal(entity.email === testEmail, true);
      assert.equal(entity.role === testRole, true);
      assert.equal(entity.created_at !== null, true);
      assert.equal(entity.updated_at === null, true);
    });

    it("Vérifie la création d'user via sa factory avec tous les champs obligatoires et optionnels fournis", async () => {
      const testEmail = "user@email.fr";
      const testPassword = generateRandomAlphanumericPhrase(80);
      const testRole = PARTAGE_SIMPLIFIE_ROLES.OF;
      const testNom = "nom";
      const testPrenom = "prenom";
      const testFonction = "fonction";
      const testTelephone = "telephone";
      const testOutilsGestion = ["outil1", "outil2"];
      const testNom_etablissement = "nom_etablissement";
      const testAdresse = "ISTELI Lille 12 rue de la paix 59100 LILLE";

      const testUai = "0881529J";
      const testSiret = "13002798000031";

      const entity = await PartageSimplifieUsersFactory.create({
        email: testEmail,
        password: testPassword,
        uai: testUai,
        siret: testSiret,
        role: testRole,
        nom: testNom,
        prenom: testPrenom,
        fonction: testFonction,
        telephone: testTelephone,
        outils_gestion: testOutilsGestion,
        nom_etablissement: testNom_etablissement,
        adresse_etablissement: testAdresse,
      });

      assert.equal(entity.email === testEmail, true);
      assert.equal(entity.role === testRole, true);
      assert.equal(entity.nom === testNom, true);
      assert.equal(entity.prenom === testPrenom, true);
      assert.equal(entity.fonction === testFonction, true);
      assert.equal(entity.telephone === testTelephone, true);
      assert.deepEqual(entity.outils_gestion, testOutilsGestion);
      assert.equal(entity.nom_etablissement === testNom_etablissement, true);
      assert.equal(entity.uai === testUai, true);
      assert.equal(entity.siret === testSiret, true);
      assert.equal(entity.created_at !== null, true);
      assert.equal(entity.updated_at === null, true);
    });

    it("Vérifie la non création d'user via sa factory si aucun email fourni", async () => {
      const testPassword = generateRandomAlphanumericPhrase(80);
      const testRole = PARTAGE_SIMPLIFIE_ROLES.OF;

      await assert.rejects(
        async () => {
          PartageSimplifieUsersFactory.create({
            password: testPassword,
            role: testRole,
          });
        },
        (err) => {
          assert.equal(err.message.includes("Can't create user, schema not valid"), true);
          return true;
        }
      );
    });

    it("Vérifie la non création d'user via sa factory si aucun password fourni", async () => {
      const testEmail = "user@email.fr";
      const testRole = PARTAGE_SIMPLIFIE_ROLES.OF;

      await assert.rejects(
        async () =>
          PartageSimplifieUsersFactory.create({
            email: testEmail,
            role: testRole,
          }),
        (err) => {
          assert.equal(err.message.includes("Can't create user, schema not valid"), true);
          return true;
        }
      );
    });

    it("Vérifie la non création d'user via sa factory si aucun role fourni", async () => {
      const testEmail = "user@email.fr";
      const testPassword = generateRandomAlphanumericPhrase(80);

      await assert.rejects(
        async () =>
          PartageSimplifieUsersFactory.create({
            email: testEmail,
            password: testPassword,
          }),
        (err) => {
          assert.equal(err.message.includes("Can't create user, schema not valid"), true);
          return true;
        }
      );
    });

    it("Vérifie la non création d'user via sa factory si un email au mauvais format est fourni", async () => {
      const testEmail = "useremail.fr";
      const testRole = PARTAGE_SIMPLIFIE_ROLES.OF;
      const testPassword = generateRandomAlphanumericPhrase(80);

      await assert.rejects(
        async () =>
          PartageSimplifieUsersFactory.create({
            email: testEmail,
            password: testPassword,
            role: testRole,
          }),
        (err) => {
          assert.equal(err.message.includes("Can't create user, schema not valid"), true);
          return true;
        }
      );
    });

    it("Vérifie la non création d'user via sa factory si un password au mauvais format est fourni", async () => {
      const testEmail = "useremail.fr";
      const testRole = PARTAGE_SIMPLIFIE_ROLES.OF;
      const testPassword = 123;

      await assert.rejects(
        async () =>
          PartageSimplifieUsersFactory.create({
            email: testEmail,
            password: testPassword,
            role: testRole,
          }),
        (err) => {
          assert.equal(err.message.includes("Can't create user, schema not valid"), true);
          return true;
        }
      );
    });

    it("Vérifie la non création d'user via sa factory si un mauvais role fourni", async () => {
      const testEmail = "user@email.fr";
      const mauvaisRole = "mauvaisRole";
      const testPassword = generateRandomAlphanumericPhrase(80);

      await assert.rejects(
        async () =>
          PartageSimplifieUsersFactory.create({
            email: testEmail,
            password: testPassword,
            role: mauvaisRole,
          }),
        (err) => {
          assert.equal(err.message.includes("Can't create user, schema not valid"), true);
          return true;
        }
      );
    });

    it("Vérifie la non création d'user via sa factory si un nom au mauvais format est fourni", async () => {
      const testEmail = "user@email.fr";
      const testPassword = generateRandomAlphanumericPhrase(80);
      const testRole = PARTAGE_SIMPLIFIE_ROLES.OF;

      await assert.rejects(
        async () =>
          PartageSimplifieUsersFactory.create({
            email: testEmail,
            password: testPassword,
            role: testRole,
            nom: 123,
          }),
        (err) => {
          assert.equal(err.message.includes("Can't create user, schema not valid"), true);
          return true;
        }
      );
    });

    it("Vérifie la non création d'user via sa factory si un prenom au mauvais format est fourni", async () => {
      const testEmail = "user@email.fr";
      const testPassword = generateRandomAlphanumericPhrase(80);
      const testRole = PARTAGE_SIMPLIFIE_ROLES.OF;

      await assert.rejects(
        async () =>
          PartageSimplifieUsersFactory.create({
            email: testEmail,
            password: testPassword,
            role: testRole,
            prenom: 123,
          }),
        (err) => {
          assert.equal(err.message.includes("Can't create user, schema not valid"), true);
          return true;
        }
      );
    });

    it("Vérifie la non création d'user via sa factory si un uai au mauvais format est fourni", async () => {
      const testEmail = "user@email.fr";
      const testPassword = generateRandomAlphanumericPhrase(80);
      const testRole = PARTAGE_SIMPLIFIE_ROLES.OF;

      await assert.rejects(
        async () =>
          PartageSimplifieUsersFactory.create({
            email: testEmail,
            password: testPassword,
            role: testRole,
            uai: 123,
          }),
        (err) => {
          assert.equal(err.message.includes("Can't create user, schema not valid"), true);
          return true;
        }
      );
    });

    it("Vérifie la non création d'user via sa factory si un siret au mauvais format est fourni", async () => {
      const testEmail = "user@email.fr";
      const testPassword = generateRandomAlphanumericPhrase(80);
      const testRole = PARTAGE_SIMPLIFIE_ROLES.OF;

      await assert.rejects(
        async () =>
          PartageSimplifieUsersFactory.create({
            email: testEmail,
            password: testPassword,
            role: testRole,
            siret: 123,
          }),
        (err) => {
          assert.equal(err.message.includes("Can't create user, schema not valid"), true);
          return true;
        }
      );
    });

    it("Vérifie la non création d'user via sa factory si une fonction au mauvais format est fournie", async () => {
      const testEmail = "user@email.fr";
      const testPassword = generateRandomAlphanumericPhrase(80);
      const testRole = PARTAGE_SIMPLIFIE_ROLES.OF;

      await assert.rejects(
        async () =>
          PartageSimplifieUsersFactory.create({
            email: testEmail,
            password: testPassword,
            role: testRole,
            fonction: 123,
          }),
        (err) => {
          assert.equal(err.message.includes("Can't create user, schema not valid"), true);
          return true;
        }
      );
    });

    it("Vérifie la non création d'user via sa factory si un telephone au mauvais format est fourni", async () => {
      const testEmail = "user@email.fr";
      const testPassword = generateRandomAlphanumericPhrase(80);
      const testRole = PARTAGE_SIMPLIFIE_ROLES.OF;

      await assert.rejects(
        async () =>
          PartageSimplifieUsersFactory.create({
            email: testEmail,
            password: testPassword,
            role: testRole,
            telephone: 123,
          }),
        (err) => {
          assert.equal(err.message.includes("Can't create user, schema not valid"), true);
          return true;
        }
      );
    });

    it("Vérifie la non création d'user via sa factory si une liste d'outils_gestion au mauvais format est fournie", async () => {
      const testEmail = "user@email.fr";
      const testPassword = generateRandomAlphanumericPhrase(80);
      const testRole = PARTAGE_SIMPLIFIE_ROLES.OF;

      await assert.rejects(
        async () =>
          PartageSimplifieUsersFactory.create({
            email: testEmail,
            password: testPassword,
            role: testRole,
            outils_gestion: 123,
          }),
        (err) => {
          assert.equal(err.message.includes("Can't create user, schema not valid"), true);
          return true;
        }
      );
    });

    it("Vérifie la non création d'user via sa factory si un nom_etablissement au mauvais format est fourni", async () => {
      const testEmail = "user@email.fr";
      const testPassword = generateRandomAlphanumericPhrase(80);
      const testRole = PARTAGE_SIMPLIFIE_ROLES.OF;

      await assert.rejects(
        async () =>
          PartageSimplifieUsersFactory.create({
            email: testEmail,
            password: testPassword,
            role: testRole,
            nom_etablissement: 123,
          }),
        (err) => {
          assert.equal(err.message.includes("Can't create user, schema not valid"), true);
          return true;
        }
      );
    });

    it("Vérifie la non création d'user via sa factory si une adresse_etablissement au mauvais format est fournie", async () => {
      const testEmail = "user@email.fr";
      const testPassword = generateRandomAlphanumericPhrase(80);
      const testRole = PARTAGE_SIMPLIFIE_ROLES.OF;

      await assert.rejects(
        async () =>
          PartageSimplifieUsersFactory.create({
            email: testEmail,
            password: testPassword,
            role: testRole,
            adresse_etablissement: 123,
          }),
        (err) => {
          assert.equal(err.message.includes("Can't create user, schema not valid"), true);
          return true;
        }
      );
    });
  });
});
