const assert = require("assert").strict;
const { PARTAGE_SIMPLIFIE_ROLES } = require("../../../../src/common/roles.js");
const { COLLECTIONS_NAMES } = require("../../../../src/common/model/collections.js");
const { dbCollection } = require("../../../../src/common/mongodb.js");
const partageSimplifieUsers = require("../../../../src/common/components/partageSimplifieUsers.js");
const { differenceInCalendarDays, differenceInHours, subMinutes } = require("date-fns");
var mongoose = require("mongoose");

describe("Service partageSimplifieUsers", () => {
  describe("createUser", () => {
    it("Permet de créer un utilisateur avec les champs obligatoires", async () => {
      const { createUser } = partageSimplifieUsers();

      const insertedId = await createUser({
        email: "user@test.fr",
        password: "password",
        role: PARTAGE_SIMPLIFIE_ROLES.OF,
      });

      const found = await dbCollection(COLLECTIONS_NAMES.PsUsers).findOne({ _id: insertedId });

      assert.equal(found.email, "user@test.fr");
      assert.equal(found.password.startsWith("$6$rounds="), true);
      assert.equal(found.role, PARTAGE_SIMPLIFIE_ROLES.OF);
    });

    it("Ne permets pas de créer un deuxième utilisateur avec le même email", async () => {
      const { createUser } = partageSimplifieUsers();

      const emailTest = "user@test.fr";

      await createUser({
        email: emailTest,
        password: "password",
        role: PARTAGE_SIMPLIFIE_ROLES.OF,
      });

      await assert.rejects(
        () =>
          createUser({
            email: emailTest,
            password: "password",
            role: PARTAGE_SIMPLIFIE_ROLES.OF,
          }),
        (err) => {
          assert.equal(err.message.includes("E11000 duplicate key error collection"), true);
          assert.equal(err.message.includes("email dup key:"), true);
          return true;
        }
      );
    });

    it("Permet de créer un utilisateur avec mot de passe random quand pas de mot de passe fourni", async () => {
      const { createUser } = partageSimplifieUsers();

      const insertedId = await createUser({
        email: "user@test.fr",
        role: PARTAGE_SIMPLIFIE_ROLES.OF,
      });

      const found = await dbCollection(COLLECTIONS_NAMES.PsUsers).findOne({ _id: insertedId });

      assert.equal(found.email, "user@test.fr");
      assert.equal(found.password.startsWith("$6$rounds="), true);
      assert.equal(found.role, PARTAGE_SIMPLIFIE_ROLES.OF);
    });

    it("Permet de créer un utilisateur avec le role administrateur", async () => {
      const { createUser } = partageSimplifieUsers();

      const insertedId = await createUser({
        email: "user@test.fr",
        role: PARTAGE_SIMPLIFIE_ROLES.ADMINISTRATOR,
      });

      const found = await dbCollection(COLLECTIONS_NAMES.PsUsers).findOne({ _id: insertedId });

      assert.equal(found.email, "user@test.fr");
      assert.equal(found.password.startsWith("$6$rounds="), true);
      assert.equal(found.role, PARTAGE_SIMPLIFIE_ROLES.ADMINISTRATOR);
    });

    it("Permet de créer un utilisateur avec tous les champs optionnels", async () => {
      const { createUser } = partageSimplifieUsers();

      const testEmail = "user@email.fr";
      const testRole = PARTAGE_SIMPLIFIE_ROLES.ADMINISTRATOR;
      const testNom = "nom";
      const testPrenom = "prenom";
      const testFonction = "fonction";
      const testTelephone = "telephone";
      const testOutilsGestion = ["outil1", "outil2"];
      const testNom_etablissement = "nom_etablissement";
      const testAdresse_etablissement = "adresse_etablissement";
      const testRegion = "region";

      const insertedId = await createUser({
        email: testEmail,
        role: testRole,
        nom: testNom,
        prenom: testPrenom,
        fonction: testFonction,
        telephone: testTelephone,
        region: testRegion,
        outils_gestion: testOutilsGestion,
        nom_etablissement: testNom_etablissement,
        adresse_etablissement: testAdresse_etablissement,
      });

      const found = await dbCollection(COLLECTIONS_NAMES.PsUsers).findOne({ _id: insertedId });

      assert.equal(found.email, testEmail);
      assert.equal(found.password.startsWith("$6$rounds="), true);
      assert.equal(found.role, testRole);
      assert.equal(found.nom, testNom);
      assert.equal(found.prenom, testPrenom);
      assert.equal(found.fonction, testFonction);
      assert.equal(found.telephone, testTelephone);
      assert.equal(found.region, testRegion);
      assert.deepEqual(found.outils_gestion, testOutilsGestion);
      assert.deepEqual(found.nom_etablissement, testNom_etablissement);
      assert.deepEqual(found.adresse_etablissement, testAdresse_etablissement);
    });

    it("Ne permets pas de créer un deuxième utilisateur avec le même couple uai-siret", async () => {
      const { createUser } = partageSimplifieUsers();

      const emailTest = "user@test.fr";
      const uaiTest = "0000000X";
      const siretTest = "19921500500018";

      const insertedId = await createUser({
        email: emailTest,
        password: "password",
        role: PARTAGE_SIMPLIFIE_ROLES.OF,
        uai: uaiTest,
        siret: siretTest,
      });

      const found = await dbCollection(COLLECTIONS_NAMES.PsUsers).findOne({ _id: insertedId });

      assert.equal(found.email, emailTest);
      assert.equal(found.password.startsWith("$6$rounds="), true);
      assert.equal(found.role, PARTAGE_SIMPLIFIE_ROLES.OF);
      assert.equal(found.uai, uaiTest);
      assert.equal(found.siret, siretTest);

      await assert.rejects(
        () =>
          createUser({
            email: "user2@test.fr",
            password: "password2",
            role: PARTAGE_SIMPLIFIE_ROLES.OF,
            uai: uaiTest,
            siret: siretTest,
          }),
        (err) => {
          assert.equal(err.message.includes("E11000 duplicate key error collection"), true);
          assert.equal(err.message.includes("uai_siret_uniques dup key:"), true);
          return true;
        }
      );
    });
  });

  describe("generatePasswordUpdateToken", () => {
    it("Génère un token avec expiration à +48h", async () => {
      const { createUser, generatePasswordUpdateToken } = partageSimplifieUsers();

      const testUserEmail = "user@test.fr";

      // Création du user
      const insertedId = await createUser({
        email: testUserEmail,
        role: PARTAGE_SIMPLIFIE_ROLES.OF,
      });

      // Génération du token et récupération du user en bdd
      const token = await generatePasswordUpdateToken(testUserEmail);
      const found = await dbCollection(COLLECTIONS_NAMES.PsUsers).findOne({ _id: insertedId });

      assert.equal(found.password_update_token, token);
      assert.equal(found.password_updated_token_at !== null, true);

      // password token should expire in 48h
      assert.equal(differenceInHours(found.password_update_token_expiry, new Date()) >= 47, true);
      assert.equal(differenceInCalendarDays(found.password_update_token_expiry, new Date()), 2);
    });

    it("Renvoie une erreur quand le user n'est pas trouvé", async () => {
      const { createUser, generatePasswordUpdateToken } = partageSimplifieUsers();

      // create user
      await createUser({ email: "KO@test.Fr", role: PARTAGE_SIMPLIFIE_ROLES.OF });

      await assert.rejects(
        () => generatePasswordUpdateToken("notFound@test.Fr"),
        (err) => {
          assert.equal(err.message, "User not found");
          return true;
        }
      );
    });

    it("Renvoie une erreur quand l'email n'est pas au bon format", async () => {
      const { createUser, generatePasswordUpdateToken } = partageSimplifieUsers();

      // create user
      await createUser({ email: "test@test.Fr", role: PARTAGE_SIMPLIFIE_ROLES.OF });

      await assert.rejects(
        () => generatePasswordUpdateToken("badFormat"),
        (err) => {
          assert.equal(err.message, "Email format not valid");
          return true;
        }
      );
    });
  });

  describe("updatePassword", () => {
    it("modifie le mot de passe d'un user et invalide le token d'update", async () => {
      const { createUser, updatePassword, generatePasswordUpdateToken } = partageSimplifieUsers();

      // Création du user
      const insertedId = await createUser({
        email: "user@test.fr",
        role: PARTAGE_SIMPLIFIE_ROLES.OF,
      });

      const foundBeforeUpdate = await dbCollection(COLLECTIONS_NAMES.PsUsers).findOne({ _id: insertedId });

      // generate update token
      const token = await generatePasswordUpdateToken("user@test.fr");
      const updatedUser = await updatePassword(token, "new-password-strong");

      assert.equal(updatedUser.email, "user@test.fr");
      assert.equal(updatedUser.role, PARTAGE_SIMPLIFIE_ROLES.OF);
      assert.equal(updatedUser.password_update_token, null);
      assert.equal(updatedUser.password_update_token_expiry, null);
      assert.equal(updatedUser.password_updated_at !== null, true);

      const foundAfterUpdate = await dbCollection(COLLECTIONS_NAMES.PsUsers).findOne({ _id: insertedId });

      assert.notEqual(foundAfterUpdate.password, foundBeforeUpdate.password);
      assert.equal(foundAfterUpdate.password_update_token, null);
      assert.equal(foundAfterUpdate.password_update_token_expiry, null);
      assert.equal(foundAfterUpdate.password_updated_at !== null, true);
    });

    it("renvoie une erreur quand le token passé ne permet pas de retrouver le user", async () => {
      const { createUser, updatePassword, generatePasswordUpdateToken } = partageSimplifieUsers();

      // Création du user
      await createUser({
        email: "user@test.fr",
        role: PARTAGE_SIMPLIFIE_ROLES.OF,
      });

      // generate update token
      await generatePasswordUpdateToken("user@test.fr");

      await assert.rejects(
        () => updatePassword("wrong token", "new-password-strong"),
        (err) => {
          assert.equal(err.message, "User not found");
          return true;
        }
      );
    });

    it("renvoie une erreur lorsque le nouveau mot de passe est trop court", async () => {
      const { createUser, updatePassword, generatePasswordUpdateToken } = partageSimplifieUsers();

      // Création du user
      await createUser({
        email: "user@test.fr",
        role: PARTAGE_SIMPLIFIE_ROLES.OF,
      });

      // generate update token
      const token = await generatePasswordUpdateToken("user@test.fr");

      const shortPassword = "hello-world";

      await assert.rejects(
        () => updatePassword(token, shortPassword),
        (err) => {
          assert.equal(err.message, "Password must be valid (at least 16 characters)");
          return true;
        }
      );
    });

    it("renvoie une erreur lorsque l'update est fait plus de 24h après la création du token", async () => {
      const { createUser, updatePassword, generatePasswordUpdateToken } = partageSimplifieUsers();

      // Création du user
      await createUser({
        email: "user@test.fr",
        role: PARTAGE_SIMPLIFIE_ROLES.OF,
      });

      // generate update token
      const token = await generatePasswordUpdateToken("user@test.fr");

      // force password_update_token_expiry to 10 minutes ago
      await dbCollection(COLLECTIONS_NAMES.PsUsers).findOneAndUpdate(
        { email: "user@test.fr" },
        { $set: { password_update_token_expiry: subMinutes(new Date(), 10) } }
      );

      await assert.rejects(
        () => updatePassword(token, "super-long-strong-password"),
        (err) => {
          assert.equal(err.message, "Password update token has expired");
          return true;
        }
      );
    });

    it("renvoie une erreur lorsque l'update est tenté avec un token null", async () => {
      const { createUser, updatePassword } = partageSimplifieUsers();

      // Création du user
      await createUser({
        email: "user@test.fr",
        role: PARTAGE_SIMPLIFIE_ROLES.OF,
      });

      await assert.rejects(
        () => updatePassword(null, "super-long-strong-password"),
        (err) => {
          assert.equal(err.message, "User not found");
          return true;
        }
      );
    });

    it("renvoie une erreur lorsque l'update a déjà été fait", async () => {
      const { createUser, updatePassword, generatePasswordUpdateToken } = partageSimplifieUsers();

      // Création du user
      await createUser({
        email: "user@test.fr",
        role: PARTAGE_SIMPLIFIE_ROLES.OF,
      });

      // generate update token
      const token = await generatePasswordUpdateToken("user@test.fr");

      // update password first time
      await updatePassword(token, "new-password-strong");

      // try again
      await assert.rejects(
        () => updatePassword(token, "super-long-strong-password"),
        (err) => {
          assert.equal(err.message, "User not found");
          return true;
        }
      );
    });
  });

  describe("authenticate", () => {
    it("Vérifie que le mot de passe est valide", async () => {
      const { createUser, authenticate } = partageSimplifieUsers();

      // Création du user
      await createUser({
        email: "user@test.fr",
        password: "password",
        role: PARTAGE_SIMPLIFIE_ROLES.OF,
      });

      const user = await authenticate("user@test.fr", "password");
      assert.equal(user.email === "user@test.fr", true);
    });

    it("Vérifie que le mot de passe est invalide", async () => {
      const { createUser, authenticate } = partageSimplifieUsers();

      // Création du user
      await createUser({
        email: "user@test.fr",
        password: "password",
        role: PARTAGE_SIMPLIFIE_ROLES.OF,
      });

      const user = await authenticate("user@test.fr", "INVALID");
      assert.equal(user, null);
    });
  });

  describe("getUser", () => {
    it("renvoie le bon utilisateur quand l'email fourni est valide", async () => {
      const { createUser, getUser } = partageSimplifieUsers();

      const emailTest = "userTest@test.fr";

      // Création du user
      const insertedId = await createUser({
        email: emailTest,
        role: PARTAGE_SIMPLIFIE_ROLES.OF,
      });

      // find user
      const found = await dbCollection(COLLECTIONS_NAMES.PsUsers).findOne({ _id: insertedId });
      assert.equal(found.email === emailTest, true);
      assert.equal(found.role === PARTAGE_SIMPLIFIE_ROLES.OF, true);
      assert.equal(found._id !== null, true);

      // get user
      const gettedUser = await getUser(found.email);
      assert.equal(gettedUser.email === found.email, true);
      assert.equal(gettedUser.role === PARTAGE_SIMPLIFIE_ROLES.OF, true);
      assert.equal(gettedUser._id !== null, true);
    });

    it("ne renvoie pas le bon utilisateur quand l'email fourni n'est pas valide", async () => {
      const { createUser, getUser } = partageSimplifieUsers();

      const emailTest = "userTest@test.fr";

      // Création du user
      const insertedId = await createUser({
        email: emailTest,
        role: PARTAGE_SIMPLIFIE_ROLES.OF,
      });

      // find user
      const found = await dbCollection(COLLECTIONS_NAMES.PsUsers).findOne({ _id: insertedId });
      assert.equal(found.email === emailTest, true);
      assert.equal(found.role === PARTAGE_SIMPLIFIE_ROLES.OF, true);
      assert.equal(found._id !== null, true);

      // get user
      await assert.rejects(getUser("badUser@test.fr"), { message: "Unable to find user" });
    });
  });

  describe("getUserById", () => {
    it("renvoie le bon utilisateur quand l'id fourni est valide", async () => {
      const { createUser, getUserById } = partageSimplifieUsers();

      const emailTest = "user@test.fr";

      // Création du user
      const insertedId = await createUser({
        email: emailTest,
        role: PARTAGE_SIMPLIFIE_ROLES.OF,
      });

      // find user
      const found = await dbCollection(COLLECTIONS_NAMES.PsUsers).findOne({ _id: insertedId });
      assert.equal(found.email === emailTest, true);
      assert.equal(found.role === PARTAGE_SIMPLIFIE_ROLES.OF, true);
      assert.equal(found._id !== null, true);

      // get user
      const gettedUser = await getUserById(found._id);
      assert.equal(gettedUser.email === found.email, true);
      assert.equal(gettedUser.role === PARTAGE_SIMPLIFIE_ROLES.OF, true);
      assert.equal(gettedUser._id !== null, true);
    });

    it("ne renvoie pas le bon utilisateur quand l'id fourni n'est pas valide", async () => {
      const { createUser, getUserById } = partageSimplifieUsers();

      const emailTest = "user@test.fr";

      // Création du user
      const insertedId = await createUser({
        email: emailTest,
        role: PARTAGE_SIMPLIFIE_ROLES.OF,
      });

      // find user
      const found = await dbCollection(COLLECTIONS_NAMES.PsUsers).findOne({ _id: insertedId });
      assert.equal(found.email === emailTest, true);
      assert.equal(found.role === PARTAGE_SIMPLIFIE_ROLES.OF, true);
      assert.equal(found._id !== null, true);

      // get user
      const objectId = new mongoose.Types.ObjectId();
      await assert.rejects(getUserById(objectId), { message: "Unable to find user" });
    });
  });

  describe("getAllUsers", () => {
    it("renvoie une liste d'utilisateurs", async () => {
      const { createUser, getAllUsers } = partageSimplifieUsers();

      await createUser({
        email: "test1@mail.com",
        role: PARTAGE_SIMPLIFIE_ROLES.OF,
        nom: "NOM1",
        prenom: "PRENOM1",
        fonction: "FONCTION1",
        telephone: "TELEPHONE1",
        outils_gestion: ["test1", "test2"],
        nom_etablissement: "ETABLISSEMENT1",
        adresse_etablissement: "ADRESSE ETABLISSEMENT1",
      });

      await createUser({
        email: "test2@mail.com",
        role: PARTAGE_SIMPLIFIE_ROLES.OF,
        nom: "NOM2",
        prenom: "PRENOM2",
        fonction: "FONCTION2",
        telephone: "TELEPHONE2",
        outils_gestion: ["test1", "test2", "test3"],
        nom_etablissement: "ETABLISSEMENT2",
        adresse_etablissement: "ADRESSE ETABLISSEMENT2",
      });

      const allUsers = await getAllUsers();
      assert.equal(allUsers.length, 2);

      // Utilisateur 1
      assert.ok(allUsers[0]._id);
      assert.equal(allUsers[0].email, "test1@mail.com");
      assert.equal(allUsers[0].role, PARTAGE_SIMPLIFIE_ROLES.OF);
      assert.equal(allUsers[0].nom, "NOM1");
      assert.equal(allUsers[0].prenom, "PRENOM1");
      assert.equal(allUsers[0].fonction, "FONCTION1");
      assert.equal(allUsers[0].telephone, "TELEPHONE1");
      assert.deepEqual(allUsers[0].outils_gestion, ["test1", "test2"]);
      assert.equal(allUsers[0].nom_etablissement, "ETABLISSEMENT1");
      assert.equal(allUsers[0].adresse_etablissement, "ADRESSE ETABLISSEMENT1");

      // Utilisateur 2
      assert.ok(allUsers[1]._id);
      assert.equal(allUsers[1].email, "test2@mail.com");
      assert.equal(allUsers[1].role, PARTAGE_SIMPLIFIE_ROLES.OF);
      assert.equal(allUsers[1].nom, "NOM2");
      assert.equal(allUsers[1].prenom, "PRENOM2");
      assert.equal(allUsers[1].fonction, "FONCTION2");
      assert.equal(allUsers[1].telephone, "TELEPHONE2");
      assert.deepEqual(allUsers[1].outils_gestion, ["test1", "test2", "test3"]);
      assert.equal(allUsers[1].nom_etablissement, "ETABLISSEMENT2");
      assert.equal(allUsers[1].adresse_etablissement, "ADRESSE ETABLISSEMENT2");
    });
  });

  describe("searchUsers", async () => {
    const { searchUsers, createUser } = partageSimplifieUsers();

    it("returns results matching email", async () => {
      const searchTerm = "rma";
      const emailTest = "havertz@rma.es";

      const insertedId = await createUser({
        email: emailTest,
        password: "password",
        role: PARTAGE_SIMPLIFIE_ROLES.OF,
      });

      const found = await dbCollection(COLLECTIONS_NAMES.PsUsers).findOne({ _id: insertedId });

      assert.equal(found.role === PARTAGE_SIMPLIFIE_ROLES.OF, true);
      assert.equal(found.email === emailTest, true);

      const results = await searchUsers({ searchTerm });

      assert.equal(results.length, 1);
      assert.ok(results[0].email, found.email);
    });

    it("returns results matching email case insensitive", async () => {
      const searchTerm = "RMa";
      const emailTest = "havertz@rma.es";

      const insertedId = await createUser({
        email: emailTest,
        password: "password",
        role: PARTAGE_SIMPLIFIE_ROLES.OF,
      });

      const found = await dbCollection(COLLECTIONS_NAMES.PsUsers).findOne({ _id: insertedId });

      assert.equal(found.role === PARTAGE_SIMPLIFIE_ROLES.OF, true);
      assert.equal(found.email === emailTest, true);

      const results = await searchUsers({ searchTerm });

      assert.equal(results.length, 1);
      assert.ok(results[0].email, found.email);
    });

    it("does not returns results without match on email", async () => {
      const searchTerm = "fcbarcelona";
      const emailTest = "havertz@rma.es";

      const insertedId = await createUser({
        email: emailTest,
        password: "password",
        role: PARTAGE_SIMPLIFIE_ROLES.OF,
      });

      const found = await dbCollection(COLLECTIONS_NAMES.PsUsers).findOne({ _id: insertedId });

      assert.equal(found.role === PARTAGE_SIMPLIFIE_ROLES.OF, true);
      assert.equal(found.email === emailTest, true);
      assert.equal(found.email === emailTest, true);

      const results = await searchUsers({ searchTerm });
      assert.equal(results.length, 0);
    });

    it("returns results matching nom_etablissement", async () => {
      const searchTerm = "FOOTB";
      const emailTest = "havertz@test.fr";
      const nomEtablissementTest = "FOOTBALL Club";

      const insertedId = await createUser({
        email: emailTest,
        password: "password",
        nom_etablissement: nomEtablissementTest,
        role: PARTAGE_SIMPLIFIE_ROLES.OF,
      });

      const found = await dbCollection(COLLECTIONS_NAMES.PsUsers).findOne({ _id: insertedId });

      assert.equal(found.role === PARTAGE_SIMPLIFIE_ROLES.OF, true);
      assert.equal(found.email === emailTest, true);
      assert.equal(found.nom_etablissement === nomEtablissementTest, true);

      const results = await searchUsers({ searchTerm });

      assert.equal(results.length, 1);
      assert.ok(results[0].email, found.email);
    });

    it("returns results matching nom_etablissement case insensitive", async () => {
      const searchTerm = "FoOTb";
      const emailTest = "havertz@test.fr";
      const nomEtablissementTest = "FOOTBALL Club";

      const insertedId = await createUser({
        email: emailTest,
        password: "password",
        nom_etablissement: nomEtablissementTest,
        role: PARTAGE_SIMPLIFIE_ROLES.OF,
      });

      const found = await dbCollection(COLLECTIONS_NAMES.PsUsers).findOne({ _id: insertedId });

      assert.equal(found.role === PARTAGE_SIMPLIFIE_ROLES.OF, true);
      assert.equal(found.email === emailTest, true);
      assert.equal(found.nom_etablissement === nomEtablissementTest, true);

      const results = await searchUsers({ searchTerm });

      assert.equal(results.length, 1);
      assert.ok(results[0].email, found.email);
    });

    it("does not returns results without match on nom_etablissement", async () => {
      const searchTerm = "TENNIS";
      const emailTest = "havertz@test.fr";
      const nomEtablissementTest = "FOOTBALL Club";

      const insertedId = await createUser({
        email: emailTest,
        password: "password",
        nom_etablissement: nomEtablissementTest,
        role: PARTAGE_SIMPLIFIE_ROLES.OF,
      });

      const found = await dbCollection(COLLECTIONS_NAMES.PsUsers).findOne({ _id: insertedId });

      assert.equal(found.role === PARTAGE_SIMPLIFIE_ROLES.OF, true);
      assert.equal(found.email === emailTest, true);
      assert.equal(found.nom_etablissement === nomEtablissementTest, true);

      const results = await searchUsers({ searchTerm });

      assert.equal(results.length, 0);
    });
  });

  describe("getUserByUaiSiret", () => {
    it("renvoie le bon utilisateur quand l'uai et le siret fournis sont valides", async () => {
      const { createUser, getUserFromUaiSiret } = partageSimplifieUsers();

      const emailTest = "userTest@test.fr";
      const testUai = "0881529J";
      const testSiret = "13002798000031";

      // Création du user
      const insertedId = await createUser({
        email: emailTest,
        role: PARTAGE_SIMPLIFIE_ROLES.OF,
        uai: testUai,
        siret: testSiret,
      });

      // find user
      const found = await dbCollection(COLLECTIONS_NAMES.PsUsers).findOne({ _id: insertedId });
      assert.equal(found.email === emailTest, true);
      assert.equal(found.role === PARTAGE_SIMPLIFIE_ROLES.OF, true);
      assert.equal(found.uai === testUai, true);
      assert.equal(found.siret === testSiret, true);
      assert.equal(found._id !== null, true);

      // get user
      const gettedUser = await getUserFromUaiSiret({ uai: testUai, siret: testSiret });
      assert.equal(gettedUser.email === found.email, true);
      assert.equal(gettedUser.role === PARTAGE_SIMPLIFIE_ROLES.OF, true);
      assert.equal(gettedUser.uai === testUai, true);
      assert.equal(gettedUser.siret === testSiret, true);
      assert.equal(gettedUser._id !== null, true);
    });

    it("ne renvoie pas le bon utilisateur quand l'uai fourni n'est pas valide", async () => {
      const { createUser, getUserFromUaiSiret } = partageSimplifieUsers();

      const emailTest = "userTest@test.fr";
      const testUai = "0881529J";
      const badUai = "7778829J";
      const testSiret = "13002798000031";

      // Création du user
      const insertedId = await createUser({
        email: emailTest,
        role: PARTAGE_SIMPLIFIE_ROLES.OF,
        uai: testUai,
        siret: testSiret,
      });

      // find user
      const found = await dbCollection(COLLECTIONS_NAMES.PsUsers).findOne({ _id: insertedId });
      assert.equal(found.email === emailTest, true);
      assert.equal(found.role === PARTAGE_SIMPLIFIE_ROLES.OF, true);
      assert.equal(found.uai === testUai, true);
      assert.equal(found.siret === testSiret, true);
      assert.equal(found._id !== null, true);

      // get user
      await assert.rejects(getUserFromUaiSiret({ uai: badUai, siret: testSiret }), { message: "Unable to find user" });
    });

    it("ne renvoie pas le bon utilisateur quand le siret fourni n'est pas valide", async () => {
      const { createUser, getUserFromUaiSiret } = partageSimplifieUsers();

      const emailTest = "userTest@test.fr";
      const testUai = "0881529J";
      const testSiret = "13002798000031";
      const badSiret = "77772798000031";

      // Création du user
      const insertedId = await createUser({
        email: emailTest,
        role: PARTAGE_SIMPLIFIE_ROLES.OF,
        uai: testUai,
        siret: testSiret,
      });

      // find user
      const found = await dbCollection(COLLECTIONS_NAMES.PsUsers).findOne({ _id: insertedId });
      assert.equal(found.email === emailTest, true);
      assert.equal(found.role === PARTAGE_SIMPLIFIE_ROLES.OF, true);
      assert.equal(found.uai === testUai, true);
      assert.equal(found.siret === testSiret, true);
      assert.equal(found._id !== null, true);

      // get user
      await assert.rejects(getUserFromUaiSiret({ uai: testUai, siret: badSiret }), { message: "Unable to find user" });
    });

    it("ne renvoie pas le bon utilisateur quand ni le siret fourni ni l'uai ne sont valides", async () => {
      const { createUser, getUserFromUaiSiret } = partageSimplifieUsers();

      const emailTest = "userTest@test.fr";
      const testUai = "0881529J";
      const badUai = "7778829J";
      const testSiret = "13002798000031";
      const badSiret = "77772798000031";

      // Création du user
      const insertedId = await createUser({
        email: emailTest,
        role: PARTAGE_SIMPLIFIE_ROLES.OF,
        uai: testUai,
        siret: testSiret,
      });

      // find user
      const found = await dbCollection(COLLECTIONS_NAMES.PsUsers).findOne({ _id: insertedId });
      assert.equal(found.email === emailTest, true);
      assert.equal(found.role === PARTAGE_SIMPLIFIE_ROLES.OF, true);
      assert.equal(found.uai === testUai, true);
      assert.equal(found.siret === testSiret, true);
      assert.equal(found._id !== null, true);

      // get user
      await assert.rejects(getUserFromUaiSiret({ uai: badUai, siret: badSiret }), { message: "Unable to find user" });
    });
  });
});
