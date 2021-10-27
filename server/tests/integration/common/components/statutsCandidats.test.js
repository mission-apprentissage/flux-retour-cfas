const assert = require("assert").strict;
const integrationTests = require("../../../utils/integrationTests");
const statutsCandidats = require("../../../../src/common/components/statutsCandidats");
const { StatutCandidat, Cfa, Formation } = require("../../../../src/common/model");
const { codesStatutsCandidats } = require("../../../../src/common/model/constants");
const { statutsTest, statutsTestUpdate, simpleStatut } = require("../../../data/sample");
const { createRandomStatutCandidat } = require("../../../data/randomizedSample");
const { reseauxCfas, duplicatesTypesCodes } = require("../../../../src/common/model/constants");
const { nockGetCfdInfo } = require("../../../utils/nockApis/nock-tablesCorrespondances");
const { nockGetMetiersByCfd } = require("../../../utils/nockApis/nock-Lba");

integrationTests(__filename, () => {
  beforeEach(() => {
    nockGetCfdInfo();
    nockGetMetiersByCfd();
  });

  describe("existsStatut", () => {
    it("Vérifie l'existence d'un statut de candidat à partir de bons paramètres", async () => {
      const { existsStatut, createStatutCandidat } = await statutsCandidats();

      const sampleNom = "SMITH";
      const samplePrenom = "John";
      const validCfd = "abcd1234";
      const validUai = "0123456Z";
      const anneeScolaire = "2021-2022";

      const statutToCreate = createRandomStatutCandidat({
        nom_apprenant: sampleNom,
        prenom_apprenant: samplePrenom,
        formation_cfd: validCfd,
        uai_etablissement: validUai,
        annee_scolaire: anneeScolaire,
      });

      await createStatutCandidat(statutToCreate);

      const found = await existsStatut({
        nom_apprenant: sampleNom,
        prenom_apprenant: samplePrenom,
        formation_cfd: validCfd,
        uai_etablissement: validUai,
        annee_scolaire: anneeScolaire,
      });
      assert.equal(found, true);
    });

    const unicityCriterion = [
      "nom_apprenant",
      "prenom_apprenant",
      "uai_etablissement",
      "formation_cfd",
      "annee_scolaire",
    ];

    unicityCriterion.forEach((unicityCriteria) => {
      it(`Vérifie qu'on ne peut pas retrouver un statut candidat avec un ${unicityCriteria} incorrect`, async () => {
        const { existsStatut, createStatutCandidat } = await statutsCandidats();

        const unicityInfo = {
          nom_apprenant: "SMITH",
          prenom_apprenant: "John",
          formation_cfd: "abcd1234",
          uai_etablissement: "0123456Z",
          annee_scolaire: "2020-2021",
        };
        const statutToCreate = createRandomStatutCandidat(unicityInfo);
        await createStatutCandidat(statutToCreate);

        const found = await existsStatut({
          ...unicityInfo,
          [unicityCriteria]: "incorrect",
        });
        assert.equal(found, false);
      });
    });
  });

  describe("getStatut", () => {
    it("Vérifie la récupération d'un statut sur nom, prenom, formation_cfd & uai_etablissement", async () => {
      const { getStatut } = await statutsCandidats();

      const randomStatut = createRandomStatutCandidat();
      const toAdd = new StatutCandidat(randomStatut);
      await toAdd.save();

      // Checks exists method
      const found = await getStatut({
        nom_apprenant: randomStatut.nom_apprenant,
        prenom_apprenant: randomStatut.prenom_apprenant,
        formation_cfd: randomStatut.formation_cfd,
        uai_etablissement: randomStatut.uai_etablissement,
        annee_scolaire: randomStatut.annee_scolaire,
      });

      assert.notDeepStrictEqual(found, null);
      assert.strictEqual(found.ine_apprenant, randomStatut.ine_apprenant);
      assert.strictEqual(found.nom_apprenant, randomStatut.nom_apprenant);
      assert.strictEqual(found.prenom_apprenant, randomStatut.prenom_apprenant);
      assert.strictEqual(found.ne_pas_solliciter, randomStatut.ne_pas_solliciter);
      assert.strictEqual(found.email_contact, randomStatut.email_contact);
      assert.strictEqual(found.formation_cfd, randomStatut.formation_cfd);
      assert.strictEqual(found.libelle_court_formation, randomStatut.libelle_court_formation);
      assert.strictEqual(found.libelle_long_formation, randomStatut.libelle_long_formation);
      assert.strictEqual(found.uai_etablissement, randomStatut.uai_etablissement);
      assert.strictEqual(found.siret_etablissement, randomStatut.siret_etablissement);
      assert.strictEqual(found.nom_etablissement, randomStatut.nom_etablissement);
      assert.strictEqual(found.statut_apprenant, randomStatut.statut_apprenant);
      assert.equal(found.annee_scolaire, randomStatut.annee_scolaire);
    });

    it("Vérifie la mauvaise récupération d'un statut sur mauvais nom", async () => {
      const { getStatut } = await statutsCandidats();

      const toAdd = new StatutCandidat(createRandomStatutCandidat());
      await toAdd.save();

      // Checks exists method
      const found = await getStatut({
        nom_apprenant: "BAD_NOM",
        prenom_apprenant: toAdd.prenom_apprenant,
        formation_cfd: toAdd.formation_cfd,
        uai_etablissement: toAdd.uai_etablissement,
        annee_scolaire: toAdd.annee_scolaire,
      });
      assert.strictEqual(found, null);
    });

    it("Vérifie la mauvaise récupération d'un statut sur mauvais prenom", async () => {
      const { getStatut } = await statutsCandidats();

      const toAdd = new StatutCandidat(createRandomStatutCandidat());
      await toAdd.save();

      // Checks exists method
      const found = await getStatut({
        nom_apprenant: toAdd.nom_apprenant,
        prenom_apprenant: "BAD_PRENOM",
        formation_cfd: toAdd.formation_cfd,
        uai_etablissement: toAdd.uai_etablissement,
        annee_scolaire: toAdd.annee_scolaire,
      });
      assert.strictEqual(found, null);
    });

    it("Vérifie la mauvaise récupération d'un statut sur un mauvais formation_cfd", async () => {
      const { getStatut } = await statutsCandidats();

      const toAdd = new StatutCandidat(statutsTest[0]);
      await toAdd.save();

      // Checks exists method
      const found = await getStatut({
        nom_apprenant: toAdd.nom_apprenant,
        prenom_apprenant: toAdd.prenom_apprenant,
        formation_cfd: "BAD_ID_FORMATION",
        uai_etablissement: toAdd.uai_etablissement,
        annee_scolaire: toAdd.annee_scolaire,
      });
      assert.deepStrictEqual(found, null);
    });

    it("Vérifie la mauvaise récupération d'un statut sur mauvais uai_etablissement", async () => {
      const { getStatut } = await statutsCandidats();

      const toAdd = new StatutCandidat(statutsTest[0]);
      await toAdd.save();

      // Checks exists method
      const found = await getStatut({
        nom_apprenant: toAdd.nom_apprenant,
        prenom_apprenant: toAdd.prenom_apprenant,
        formation_cfd: toAdd.formation_cfd,
        uai_etablissement: "BAD_UAI",
        annee_scolaire: toAdd.annee_scolaire,
      });
      assert.strictEqual(found, null);
    });
  });

  describe("addOrUpdateStatuts", () => {
    it("Vérifie l'ajout ou la mise à jour d'un statut'", async () => {
      const { addOrUpdateStatuts } = await statutsCandidats();

      // Add statuts test
      await addOrUpdateStatuts(statutsTest);

      // Checks addOrUpdateStatuts method
      assert.strictEqual(await StatutCandidat.countDocuments({}), statutsTest.length);
      const { added, updated } = await addOrUpdateStatuts(statutsTestUpdate);

      // Check added
      assert.strictEqual(added.length, 1);
      const foundAdded = await StatutCandidat.findById(added[0]._id).lean();
      assert.strictEqual(foundAdded.ine_apprenant, statutsTestUpdate[3].ine_apprenant);
      assert.strictEqual(foundAdded.nom_apprenant, statutsTestUpdate[3].nom_apprenant);
      assert.strictEqual(foundAdded.prenom_apprenant, statutsTestUpdate[3].prenom_apprenant);
      assert.strictEqual(foundAdded.ne_pas_solliciter, statutsTestUpdate[3].ne_pas_solliciter);
      assert.strictEqual(foundAdded.email_contact, statutsTestUpdate[3].email_contact);
      assert.strictEqual(foundAdded.formation_cfd, statutsTestUpdate[3].formation_cfd);
      assert.strictEqual(foundAdded.uai_etablissement, statutsTestUpdate[3].uai_etablissement);
      assert.strictEqual(foundAdded.siret_etablissement, statutsTestUpdate[3].siret_etablissement);
      assert.strictEqual(foundAdded.statut_apprenant, statutsTestUpdate[3].statut_apprenant);
      assert.strictEqual(foundAdded.updated_at, null);
      assert.strictEqual(foundAdded.annee_formation, statutsTestUpdate[3].annee_formation);
      assert.equal(foundAdded.annee_scolaire, statutsTestUpdate[3].annee_scolaire);
      assert.deepEqual(foundAdded.periode_formation, statutsTestUpdate[3].periode_formation);

      // Check updated
      assert.strictEqual(updated.length, 3);

      const firstUpdated = await StatutCandidat.findById(updated[0]._id).lean();
      assert.strictEqual(firstUpdated.ine_apprenant, statutsTestUpdate[0].ine_apprenant);
      assert.strictEqual(firstUpdated.nom_apprenant, statutsTestUpdate[0].nom_apprenant);
      assert.strictEqual(firstUpdated.prenom_apprenant, statutsTestUpdate[0].prenom_apprenant);
      assert.strictEqual(firstUpdated.ne_pas_solliciter, statutsTestUpdate[0].ne_pas_solliciter);
      assert.strictEqual(firstUpdated.email_contact, statutsTestUpdate[0].email_contact);
      assert.strictEqual(firstUpdated.formation_cfd, statutsTestUpdate[0].formation_cfd);
      assert.strictEqual(firstUpdated.libelle_court_formation, statutsTestUpdate[0].libelle_court_formation);
      assert.strictEqual(firstUpdated.libelle_long_formation, statutsTestUpdate[0].libelle_long_formation);
      assert.strictEqual(firstUpdated.uai_etablissement, statutsTestUpdate[0].uai_etablissement);
      assert.strictEqual(firstUpdated.siret_etablissement, statutsTestUpdate[0].siret_etablissement);
      assert.strictEqual(firstUpdated.nom_etablissement, statutsTestUpdate[0].nom_etablissement);
      assert.strictEqual(firstUpdated.statut_apprenant, statutsTestUpdate[0].statut_apprenant);
      assert.equal(firstUpdated.annee_scolaire, statutsTestUpdate[0].annee_scolaire);
      assert.ok(firstUpdated.date_mise_a_jour_statut);
      assert.ok(firstUpdated.updated_at);

      const secondUpdated = await StatutCandidat.findById(updated[1]._id).lean();
      assert.strictEqual(secondUpdated.ine_apprenant, statutsTestUpdate[1].ine_apprenant);
      assert.strictEqual(secondUpdated.nom_apprenant, statutsTestUpdate[1].nom_apprenant);
      assert.strictEqual(secondUpdated.prenom_apprenant, statutsTestUpdate[1].prenom_apprenant);
      assert.strictEqual(secondUpdated.ne_pas_solliciter, statutsTestUpdate[1].ne_pas_solliciter);
      assert.strictEqual(secondUpdated.email_contact, statutsTestUpdate[1].email_contact);
      assert.strictEqual(secondUpdated.formation_cfd, statutsTestUpdate[1].formation_cfd);
      assert.strictEqual(secondUpdated.uai_etablissement, statutsTestUpdate[1].uai_etablissement);
      assert.strictEqual(secondUpdated.siret_etablissement, statutsTestUpdate[1].siret_etablissement);
      assert.strictEqual(secondUpdated.nom_etablissement, statutsTestUpdate[1].nom_etablissement);
      assert.strictEqual(secondUpdated.statut_apprenant, statutsTestUpdate[1].statut_apprenant);
      assert.equal(secondUpdated.annee_scolaire, statutsTestUpdate[1].annee_scolaire);
      assert.ok(secondUpdated.date_mise_a_jour_statut);
      assert.ok(secondUpdated.updated_at);

      const thirdUpdated = await StatutCandidat.findById(updated[2]._id).lean();
      assert.strictEqual(thirdUpdated.nom_apprenant, statutsTestUpdate[2].nom_apprenant);
      assert.strictEqual(thirdUpdated.prenom_apprenant, statutsTestUpdate[2].prenom_apprenant);
      assert.strictEqual(thirdUpdated.ne_pas_solliciter, statutsTestUpdate[2].ne_pas_solliciter);
      assert.strictEqual(thirdUpdated.email_contact, statutsTestUpdate[2].email_contact);
      assert.strictEqual(thirdUpdated.formation_cfd, statutsTestUpdate[2].formation_cfd);
      assert.strictEqual(thirdUpdated.uai_etablissement, statutsTestUpdate[2].uai_etablissement);
      assert.strictEqual(thirdUpdated.siret_etablissement, statutsTestUpdate[2].siret_etablissement);
      assert.strictEqual(thirdUpdated.nom_etablissement, statutsTestUpdate[2].nom_etablissement);
      assert.strictEqual(thirdUpdated.statut_apprenant, statutsTestUpdate[2].statut_apprenant);
      assert.equal(thirdUpdated.annee_scolaire, statutsTestUpdate[2].annee_scolaire);
      assert.ok(thirdUpdated.date_mise_a_jour_statut);
      assert.ok(thirdUpdated.updated_at);
    });

    it("Vérifie qu'on peut créer un statut sans annee_scolaire", async () => {
      const { addOrUpdateStatuts } = await statutsCandidats();
      const randomStatut = createRandomStatutCandidat();
      delete randomStatut.annee_scolaire;

      const result = await addOrUpdateStatuts([randomStatut]);
      assert.equal(result.added.length, 1);
      assert.equal(result.updated.length, 0);
      assert.equal(await StatutCandidat.countDocuments(), 1);
    });

    it("Vérifie qu'un statut sans annee_scolaire est updaté lorsque le même statut est envoyé avec annee_scolaire", async () => {
      const { addOrUpdateStatuts } = await statutsCandidats();
      const statutWithoutAnneeScolaire = createRandomStatutCandidat({ annee_scolaire: null });
      const sameStatutWithAnneeScolaire = { ...statutWithoutAnneeScolaire, annee_scolaire: "2021-2022" };

      // create the statut
      const result1 = await addOrUpdateStatuts([statutWithoutAnneeScolaire]);
      assert.equal(result1.added.length, 1);
      assert.equal(result1.updated.length, 0);
      assert.equal(result1.added[0].annee_scolaire, null);
      // send the same statut but with annee_scolaire, it should update it
      const result2 = await addOrUpdateStatuts([sameStatutWithAnneeScolaire]);
      assert.equal(result2.added.length, 0);
      assert.equal(result2.updated.length, 1);
      assert.equal(result2.updated[0].annee_scolaire, sameStatutWithAnneeScolaire.annee_scolaire);
      assert.equal(await StatutCandidat.countDocuments(), 1);
    });

    it("Vérifie qu'un statut avec annee_scolaire dans un batch de statuts sans annee_scolaire est quand même créé", async () => {
      const { addOrUpdateStatuts } = await statutsCandidats();
      const statutWithAnneeScolaire = createRandomStatutCandidat({ annee_scolaire: "2021-2022" });
      const statutWithoutAnneeScolaire = createRandomStatutCandidat({ annee_scolaire: null });

      const result = await addOrUpdateStatuts([statutWithAnneeScolaire, statutWithoutAnneeScolaire]);
      assert.equal(result.added.length, 2);
      const addedElement = result.added[0];
      assert.equal(addedElement.annee_scolaire, statutWithAnneeScolaire.annee_scolaire);
      assert.equal(addedElement.nom_apprenant, statutWithAnneeScolaire.nom_apprenant);
      assert.equal(result.updated.length, 0);
      assert.equal(await StatutCandidat.countDocuments(), 2);
    });

    it("Vérifie qu'on ne crée pas de doublon pour un statut créé sans annee_scolaire", async () => {
      const { addOrUpdateStatuts } = await statutsCandidats();
      const statutWithoutAnneeScolaire = createRandomStatutCandidat({ annee_scolaire: null });

      const result = await addOrUpdateStatuts([statutWithoutAnneeScolaire]);
      assert.equal(result.added.length, 1);
      assert.equal(result.updated.length, 0);

      await addOrUpdateStatuts([statutWithoutAnneeScolaire]);
      await addOrUpdateStatuts([statutWithoutAnneeScolaire]);
      await addOrUpdateStatuts([statutWithoutAnneeScolaire]);
      assert.equal(await StatutCandidat.countDocuments(), 1);
    });

    it("Vérifie qu'on update le siret_etablissement d'un statut existant qui n'en a pas avec le SIRET de l'élément passé si le reste des infos est identique", async () => {
      const { addOrUpdateStatuts } = await statutsCandidats();

      const statutWithoutSiret = { ...createRandomStatutCandidat(), siret_etablissement: null };
      const result = await addOrUpdateStatuts([statutWithoutSiret]);
      assert.strictEqual(result.added.length, 1);
      assert.strictEqual(result.updated.length, 0);

      // send the same statut but with a siret
      const sameStatutWithSiret = { ...statutWithoutSiret, siret_etablissement: "12312312300099" };
      const { added, updated } = await addOrUpdateStatuts([sameStatutWithSiret]);

      // statut should have been updated
      assert.strictEqual(added.length, 0, "added problem");
      assert.strictEqual(updated.length, 1);
      const count = await StatutCandidat.countDocuments();
      assert.strictEqual(count, 1);

      // check in db
      const found = await StatutCandidat.findById(result.added[0]._id);
      assert.deepStrictEqual(found.siret_etablissement, "12312312300099");
      assert.notStrictEqual(found.updated_at, null);
    });

    it("Vérifie qu'un changement sur le champ periode_formation d'un statut existant est considéré comme un update", async () => {
      const { addOrUpdateStatuts } = await statutsCandidats();

      const statutWithoutPeriodeFormation = createRandomStatutCandidat({ periode_formation: null });
      const result = await addOrUpdateStatuts([statutWithoutPeriodeFormation]);
      assert.strictEqual(result.added.length, 1);
      assert.strictEqual(result.updated.length, 0);

      // send the same statut but with a different periode_formation
      const sameStatutWithPeriodeFormation = { ...statutWithoutPeriodeFormation, periode_formation: [2021, 2022] };
      const { added, updated } = await addOrUpdateStatuts([sameStatutWithPeriodeFormation]);

      // statut should have been updated
      assert.strictEqual(added.length, 0);
      assert.strictEqual(updated.length, 1);
      const count = await StatutCandidat.countDocuments();
      assert.strictEqual(count, 1);

      // check in db
      const found = await StatutCandidat.findById(result.added[0]._id).lean();
      assert.deepEqual(found.periode_formation, [2021, 2022]);
      assert.notEqual(found.updated_at, null);
    });

    it("Vérifie qu'un changement sur le champ annee_formation d'un statut existant est considéré comme un update", async () => {
      const { addOrUpdateStatuts } = await statutsCandidats();

      const statutWithoutAnneeFormation = createRandomStatutCandidat({ annee_formation: null });
      const result = await addOrUpdateStatuts([statutWithoutAnneeFormation]);
      assert.strictEqual(result.added.length, 1);
      assert.strictEqual(result.updated.length, 0);

      // send the same statut but with a different annee_formation
      const sameStatutWithAnneeFormation = { ...statutWithoutAnneeFormation, annee_formation: 2020 };
      const { added, updated } = await addOrUpdateStatuts([sameStatutWithAnneeFormation]);

      // statut should have been updated
      assert.strictEqual(added.length, 0);
      assert.strictEqual(updated.length, 1);
      const count = await StatutCandidat.countDocuments();
      assert.strictEqual(count, 1);

      // check in db
      const found = await StatutCandidat.findById(result.added[0]._id).lean();
      assert.strictEqual(found.annee_formation, 2020);
      assert.notEqual(found.updated_at, null);
    });

    it("Vérifie que nom_apprenant est un critère d'unicité (on crée un nouveau statut candidat quand un ajoute un autre statut identique mais avec un nom_apprenant différent)", async () => {
      const { addOrUpdateStatuts } = await statutsCandidats();

      const sampleNom = "SMITH";
      const sampleNom2 = "JONES";
      const samplePrenom = "John";
      const validCfd = "abcd1234";
      const validUai = "0123456Z";

      // Create 2 distinct items
      const uniqueStatutToCreate = {
        ...createRandomStatutCandidat(),
        nom_apprenant: sampleNom,
        prenom_apprenant: samplePrenom,
        formation_cfd: validCfd,
        uai_etablissement: validUai,
      };
      const firstCallResult = await addOrUpdateStatuts([uniqueStatutToCreate]);
      assert.strictEqual(firstCallResult.added.length, 1);
      assert.strictEqual(firstCallResult.updated.length, 0);

      // send the same statut information but with a different nom
      const sameStatutInformationWithDifferentNom = { ...uniqueStatutToCreate, nom_apprenant: sampleNom2 };
      const secondCallResult = await addOrUpdateStatuts([sameStatutInformationWithDifferentNom]);

      // a new statut should have been created
      assert.strictEqual(secondCallResult.added.length, 1);
      assert.strictEqual(secondCallResult.updated.length, 0);
      const count = await StatutCandidat.countDocuments();
      assert.strictEqual(count, 2);

      // check in db
      const found = await StatutCandidat.findById(firstCallResult.added[0]._id);
      assert.deepStrictEqual(found.nom_apprenant, sampleNom);
      assert.strictEqual(found.updated_at, null);
    });

    it("Vérifie que prenom_apprenant est un critère d'unicité (on crée un nouveau statut candidat quand un ajoute un autre statut identique mais avec un prenom_apprenant différent)", async () => {
      const { addOrUpdateStatuts } = await statutsCandidats();

      const sampleNom = "SMITH";
      const samplePrenom = "John";
      const samplePrenom2 = "Jack";
      const validCfd = "abcd1234";
      const validUai = "0123456Z";

      // Create 2 distinct items
      const uniqueStatutToCreate = {
        ...createRandomStatutCandidat(),
        nom_apprenant: sampleNom,
        prenom_apprenant: samplePrenom,
        formation_cfd: validCfd,
        uai_etablissement: validUai,
      };
      const firstCallResult = await addOrUpdateStatuts([uniqueStatutToCreate]);
      assert.strictEqual(firstCallResult.added.length, 1);
      assert.strictEqual(firstCallResult.updated.length, 0);

      // send the same statut but with a different prenom
      const sameStatutWithDifferentPrenom = { ...uniqueStatutToCreate, prenom_apprenant: samplePrenom2 };
      const secondCallResult = await addOrUpdateStatuts([sameStatutWithDifferentPrenom]);

      // a new statut should have been created
      assert.strictEqual(secondCallResult.added.length, 1);
      assert.strictEqual(secondCallResult.updated.length, 0);
      const count = await StatutCandidat.countDocuments();
      assert.strictEqual(count, 2);

      // check in db
      const found = await StatutCandidat.findById(firstCallResult.added[0]._id);
      assert.deepStrictEqual(found.prenom_apprenant, samplePrenom);
      assert.strictEqual(found.updated_at, null);
    });

    it("Vérifie que formation_cfd est un critère d'unicité (on crée un nouveau statut candidat quand un ajoute un autre statut identique mais avec un formation_cfd différent)", async () => {
      const { addOrUpdateStatuts } = await statutsCandidats();

      const sampleNom = "SMITH";
      const samplePrenom = "John";
      const validCfd = "abcd1234";
      const validCfd2 = "abcd9999";
      const validUai = "0123456Z";

      // Create 2 distinct items
      const uniqueStatutToCreate = {
        ...createRandomStatutCandidat(),
        nom_apprenant: sampleNom,
        prenom_apprenant: samplePrenom,
        formation_cfd: validCfd,
        uai_etablissement: validUai,
      };
      const firstCallResult = await addOrUpdateStatuts([uniqueStatutToCreate]);
      assert.strictEqual(firstCallResult.added.length, 1);
      assert.strictEqual(firstCallResult.updated.length, 0);

      // send the same statut but with a different cfd
      const sameStatutWithDifferentCfd = { ...uniqueStatutToCreate, formation_cfd: validCfd2 };
      const secondCallResult = await addOrUpdateStatuts([sameStatutWithDifferentCfd]);

      // a new statut should have been created
      assert.strictEqual(secondCallResult.added.length, 1);
      assert.strictEqual(secondCallResult.updated.length, 0);
      const count = await StatutCandidat.countDocuments();
      assert.strictEqual(count, 2);

      // check in db
      const found = await StatutCandidat.findById(firstCallResult.added[0]._id);
      assert.deepStrictEqual(found.formation_cfd, validCfd);
      assert.strictEqual(found.updated_at, null);
    });

    it("Vérifie que annee_scolaire est un critère d'unicité (on crée un nouveau statut candidat quand un ajoute un autre statut identique mais avec un annee_scolaire différent)", async () => {
      const { addOrUpdateStatuts } = await statutsCandidats();

      const sampleNom = "SMITH";
      const samplePrenom = "John";
      const validCfd = "abcd1234";
      const validUai = "0123456Z";
      const anneeScolaire = "2020-2021";

      // Create 2 distinct items
      const uniqueStatutToCreate = {
        ...createRandomStatutCandidat(),
        nom_apprenant: sampleNom,
        prenom_apprenant: samplePrenom,
        formation_cfd: validCfd,
        uai_etablissement: validUai,
        annee_scolaire: anneeScolaire,
      };
      const firstCallResult = await addOrUpdateStatuts([uniqueStatutToCreate]);
      assert.equal(firstCallResult.added.length, 1);
      assert.equal(firstCallResult.updated.length, 0);

      // send the same statut information but with a different annee_scolaire
      const sameStatutWithDifferentUai = { ...uniqueStatutToCreate, annee_scolaire: "2021-2022" };
      const secondCallResult = await addOrUpdateStatuts([sameStatutWithDifferentUai]);

      // a new statut should have been created
      assert.equal(secondCallResult.added.length, 1);
      assert.equal(secondCallResult.updated.length, 0);
      const count = await StatutCandidat.countDocuments();
      assert.equal(count, 2);

      // check in db that first created element was not updated
      const found = await StatutCandidat.findById(firstCallResult.added[0]._id);
      assert.equal(found.annee_scolaire, anneeScolaire);
      assert.equal(found.updated_at, null);
    });

    it("Vérifie que uai_etablissement est un critère d'unicité (on crée un nouveau statut candidat quand un ajoute un autre statut identique mais avec un uai_etablissement différent)", async () => {
      const { addOrUpdateStatuts } = await statutsCandidats();

      const sampleNom = "SMITH";
      const samplePrenom = "John";
      const validCfd = "abcd1234";
      const validUai = "0123456Z";
      const validUai2 = "1111111Z";

      // Create 2 distinct items
      const uniqueStatutToCreate = {
        ...createRandomStatutCandidat(),
        nom_apprenant: sampleNom,
        prenom_apprenant: samplePrenom,
        formation_cfd: validCfd,
        uai_etablissement: validUai,
      };
      const firstCallResult = await addOrUpdateStatuts([uniqueStatutToCreate]);
      assert.strictEqual(firstCallResult.added.length, 1);
      assert.strictEqual(firstCallResult.updated.length, 0);

      // send the same statut information but with a different uai
      const sameStatutWithDifferentUai = { ...uniqueStatutToCreate, uai_etablissement: validUai2 };
      const secondCallResult = await addOrUpdateStatuts([sameStatutWithDifferentUai]);

      // a new statut should have been created
      assert.strictEqual(secondCallResult.added.length, 1);
      assert.strictEqual(secondCallResult.updated.length, 0);
      const count = await StatutCandidat.countDocuments();
      assert.strictEqual(count, 2);

      // check in db
      const found = await StatutCandidat.findById(firstCallResult.added[0]._id);
      assert.deepStrictEqual(found.uai_etablissement, validUai);
      assert.strictEqual(found.updated_at, null);
    });

    it("Vérifie qu'on ne crée pas mais MAJ un statut candidat quand un ajoute un autre statut identique mais avec une période différente", async () => {
      const { addOrUpdateStatuts } = await statutsCandidats();

      const samplePeriode = [2019, 2020];
      const samplePeriode2 = [2021, 2022];
      const input = {
        nom_apprenant: "SMITH",
        prenom_apprenant: "John",
        formation_cfd: "abcd1234",
        uai_etablissement: "0123456Z",
        periode_formation: samplePeriode,
      };

      // Create 2 distinct items
      const uniqueStatutToCreate = createRandomStatutCandidat(input);
      const firstCallResult = await addOrUpdateStatuts([uniqueStatutToCreate]);
      assert.strictEqual(firstCallResult.added.length, 1);
      assert.strictEqual(firstCallResult.updated.length, 0);

      // send the same statut but with a different periode_formation
      const sameStatutWithDifferentPeriode = { ...uniqueStatutToCreate, periode_formation: samplePeriode2 };
      const secondCallResult = await addOrUpdateStatuts([sameStatutWithDifferentPeriode]);

      // no new statut should have been created
      assert.strictEqual(secondCallResult.added.length, 0);
      assert.strictEqual(secondCallResult.updated.length, 1);
      const count = await StatutCandidat.countDocuments();
      assert.strictEqual(count, 1);

      // check in db
      const found = await StatutCandidat.findById(firstCallResult.added[0]._id);
      assert.deepStrictEqual(found.periode_formation.join(), samplePeriode2.join());
      assert.notDeepStrictEqual(found.updated_at, null);
    });

    it("Vérifie qu'on ne crée pas mais MAJ un statut candidat quand un ajoute un autre statut identique mais avec une année différente", async () => {
      const { addOrUpdateStatuts } = await statutsCandidats();

      const sampleNom = "SMITH";
      const samplePrenom = "John";
      const validCfd = "abcd1234";
      const validUai = "0123456Z";
      const sampleAnnee = 2019;
      const sampleAnnee2 = 2021;

      // Create 2 distinct items
      const uniqueStatutToCreate = {
        ...createRandomStatutCandidat(),
        nom_apprenant: sampleNom,
        prenom_apprenant: samplePrenom,
        formation_cfd: validCfd,
        uai_etablissement: validUai,
        annee_formation: sampleAnnee,
      };
      const firstCallResult = await addOrUpdateStatuts([uniqueStatutToCreate]);
      assert.strictEqual(firstCallResult.added.length, 1);
      assert.strictEqual(firstCallResult.updated.length, 0);

      // send the same statut but with a different annee_formation
      const sameStatutWithDifferentAnnee = { ...uniqueStatutToCreate, annee_formation: sampleAnnee2 };
      const secondCallResult = await addOrUpdateStatuts([sameStatutWithDifferentAnnee]);

      // no new statut should have been created
      assert.strictEqual(secondCallResult.added.length, 0);
      assert.strictEqual(secondCallResult.updated.length, 1);
      const count = await StatutCandidat.countDocuments();
      assert.strictEqual(count, 1);

      // check in db
      const found = await StatutCandidat.findById(firstCallResult.added[0]._id);
      assert.deepStrictEqual(found.annee_formation, sampleAnnee2);
      assert.notDeepStrictEqual(found.updated_at, null);
    });

    it("Vérifie qu'on ne crée pas mais MAJ un statut candidat quand un ajoute un autre statut identique mais avec un siret_etablissement différent", async () => {
      const { addOrUpdateStatuts } = await statutsCandidats();

      const sampleNom = "SMITH";
      const samplePrenom = "John";
      const validCfd = "abcd1234";
      const validUai = "0123456Z";
      const siret_etablissement = "80460782800088";
      const siret_etablissement2 = "12345678901234";

      // Create 2 distinct items
      const uniqueStatutToCreate = {
        ...createRandomStatutCandidat(),
        nom_apprenant: sampleNom,
        prenom_apprenant: samplePrenom,
        formation_cfd: validCfd,
        uai_etablissement: validUai,
        siret_etablissement,
      };
      const firstCallResult = await addOrUpdateStatuts([uniqueStatutToCreate]);
      assert.strictEqual(firstCallResult.added.length, 1);
      assert.strictEqual(firstCallResult.updated.length, 0);

      // send the same statut but with a different siret_etablissement
      const sameStatutWithDifferentAnnee = { ...uniqueStatutToCreate, siret_etablissement: siret_etablissement2 };
      const secondCallResult = await addOrUpdateStatuts([sameStatutWithDifferentAnnee]);

      // no new statut should have been created
      assert.strictEqual(secondCallResult.added.length, 0);
      assert.strictEqual(secondCallResult.updated.length, 1);
      const count = await StatutCandidat.countDocuments();
      assert.strictEqual(count, 1);

      const found = await StatutCandidat.findById(firstCallResult.added[0]._id);
      assert.deepStrictEqual(found.siret_etablissement, siret_etablissement2);
    });

    it("Vérifie qu'on ne crée pas mais MAJ un statut candidat quand un ajoute un autre statut identique mais avec une différence sur les prénoms 2-3 / email", async () => {
      const { addOrUpdateStatuts } = await statutsCandidats();

      const sampleNom = "SMITH";
      const samplePrenom = "John";
      const sampleEmail = "john@email.fr";
      const validCfd = "abcd1234";
      const validUai = "0123456Z";

      const updatedEmail = "other@email.fr";

      // Create 2 distinct items
      const uniqueStatutToCreate = {
        ...createRandomStatutCandidat(),
        nom_apprenant: sampleNom,
        prenom_apprenant: samplePrenom,
        formation_cfd: validCfd,
        uai_etablissement: validUai,
        email_contact: sampleEmail,
      };
      const firstCallResult = await addOrUpdateStatuts([uniqueStatutToCreate]);
      assert.strictEqual(firstCallResult.added.length, 1);
      assert.strictEqual(firstCallResult.updated.length, 0);

      // send the same statut but with updates on prenom2-3 & email
      const sameStatutWithUpdatesPrenomEmail = {
        ...uniqueStatutToCreate,
        email_contact: updatedEmail,
      };
      const secondCallResult = await addOrUpdateStatuts([sameStatutWithUpdatesPrenomEmail]);

      // no new statut should have been created but update only
      assert.strictEqual(secondCallResult.added.length, 0);
      assert.strictEqual(secondCallResult.updated.length, 1);
      const count = await StatutCandidat.countDocuments();
      assert.strictEqual(count, 1);

      // check in db
      const found = await StatutCandidat.findById(firstCallResult.added[0]._id);
      assert.deepStrictEqual(found.email_contact, updatedEmail);
      assert.notDeepStrictEqual(found.updated_at, null);
    });
  });

  describe("updateStatutCandidat", () => {
    it("Vérifie qu'on update PAS historique_statut_apprenant quand un statut_apprenant identique à l'actuel est envoyé", async () => {
      const { updateStatut, createStatutCandidat } = await statutsCandidats();

      const createdStatut = await createStatutCandidat(simpleStatut);

      assert.deepStrictEqual(createdStatut.historique_statut_apprenant.length, 1);
      assert.deepStrictEqual(
        createdStatut.historique_statut_apprenant[0].valeur_statut,
        createdStatut.statut_apprenant
      );
      assert.deepStrictEqual(createdStatut.historique_statut_apprenant[0].position_statut, 1);

      // Mise à jour du statut avec le même statut_apprenant
      await updateStatut(createdStatut._id, { statut_apprenant: simpleStatut.statut_apprenant });

      // Check value in db
      const found = await StatutCandidat.findById(createdStatut._id);
      assert.strictEqual(found.historique_statut_apprenant.length, 1);
    });

    it("Vérifie qu'on update historique_statut_apprenant quand un NOUVEAU statut_apprenant est envoyé", async () => {
      const { updateStatut, createStatutCandidat } = await statutsCandidats();

      const createdStatut = await createStatutCandidat(simpleStatut);

      assert.strictEqual(createdStatut.historique_statut_apprenant.length, 1);
      assert.strictEqual(createdStatut.historique_statut_apprenant[0].valeur_statut, createdStatut.statut_apprenant);
      assert.strictEqual(createdStatut.historique_statut_apprenant[0].position_statut, 1);

      // Mise à jour du statut avec nouveau statut_apprenant
      const updatePayload = {
        statut_apprenant: codesStatutsCandidats.abandon,
        date_metier_mise_a_jour_statut: new Date().toISOString(),
      };
      await updateStatut(createdStatut._id, updatePayload);

      // Check value in db
      const found = await StatutCandidat.findById(createdStatut._id);
      assert.equal(found.historique_statut_apprenant.length, 2);
      assert.equal(found.historique_statut_apprenant[0].valeur_statut, createdStatut.statut_apprenant);
      assert.equal(found.historique_statut_apprenant[0].position_statut, 1);
      assert.equal(found.historique_statut_apprenant[1].valeur_statut, codesStatutsCandidats.abandon);
      assert.equal(found.historique_statut_apprenant[1].position_statut, 2);
      assert.equal(
        found.historique_statut_apprenant[1].date_statut.getTime(),
        new Date(updatePayload.date_metier_mise_a_jour_statut).getTime()
      );
    });

    it("Vérifie qu'on met à jour updated_at après un update", async () => {
      const { updateStatut, createStatutCandidat } = await statutsCandidats();

      const createdStatut = await createStatutCandidat(createRandomStatutCandidat());
      assert.strictEqual(createdStatut.updated_at, null);

      // First update
      await updateStatut(createdStatut._id, { prenom_apprenant: "André-Pierre" });
      // Check value in db
      const foundAfterFirstUpdate = await StatutCandidat.findById(createdStatut._id);
      assert.notStrictEqual(foundAfterFirstUpdate.prenom_apprenant, createdStatut.prenom_apprenant);
      assert.notStrictEqual(foundAfterFirstUpdate.updated_at, null);

      // Second update
      await updateStatut(createdStatut._id, { nom_apprenant: "Gignac" });
      const foundAfterSecondUpdate = await StatutCandidat.findById(createdStatut._id);
      assert.notStrictEqual(foundAfterSecondUpdate.nom_apprenant, createdStatut.nom_apprenant);
      assert.notStrictEqual(foundAfterSecondUpdate.updated_at, foundAfterFirstUpdate.updated_at);
    });
  });

  describe("createStatutCandidat", () => {
    it("Vérifie la création d'un statut candidat randomisé", async () => {
      const { createStatutCandidat } = await statutsCandidats();

      const randomStatut = createRandomStatutCandidat();

      const createdStatut = await createStatutCandidat(randomStatut);
      const createdStatutJson = createdStatut.toJSON();

      assert.strictEqual(createdStatutJson.ine_apprenant, randomStatut.ine_apprenant);
      assert.strictEqual(createdStatutJson.nom_apprenant, randomStatut.nom_apprenant);
      assert.strictEqual(createdStatutJson.prenom_apprenant, randomStatut.prenom_apprenant);
      assert.strictEqual(createdStatutJson.ne_pas_solliciter, randomStatut.ne_pas_solliciter);
      assert.strictEqual(createdStatutJson.email_contact, randomStatut.email_contact);
      assert.strictEqual(createdStatutJson.formation_cfd, randomStatut.formation_cfd);
      assert.strictEqual(createdStatutJson.libelle_court_formation, randomStatut.libelle_court_formation);
      assert.strictEqual(createdStatutJson.libelle_long_formation, randomStatut.libelle_long_formation);
      assert.strictEqual(createdStatutJson.uai_etablissement, randomStatut.uai_etablissement);
      assert.strictEqual(createdStatutJson.siret_etablissement, randomStatut.siret_etablissement);
      assert.strictEqual(createdStatutJson.nom_etablissement, randomStatut.nom_etablissement);
      assert.strictEqual(createdStatutJson.statut_apprenant, randomStatut.statut_apprenant);
      assert.strictEqual(createdStatutJson.source, randomStatut.source);
      assert.strictEqual(createdStatutJson.annee_formation, randomStatut.annee_formation);
      assert.deepStrictEqual(createdStatutJson.periode_formation, randomStatut.periode_formation);
      assert.deepStrictEqual(createdStatutJson.annee_scolaire, randomStatut.annee_scolaire);
    });

    it("Vérifie qu'à la création d'un statut avec un siret invalide on set le champ siret_etablissement_valid", async () => {
      const { createStatutCandidat } = await statutsCandidats();

      const statutWithInvalidSiret = { ...createRandomStatutCandidat(), siret_etablissement: "invalid-siret" };
      const createdStatut = await createStatutCandidat(statutWithInvalidSiret);

      assert.strictEqual(createdStatut.siret_etablissement_valid, false);
    });

    it("Vérifie qu'à la création d'un statut avec un siret valid on set le champ siret_etablissement_valid", async () => {
      const { createStatutCandidat } = await statutsCandidats();

      const validSiret = "12312312300099";
      const statutWithValidSiret = { ...createRandomStatutCandidat(), siret_etablissement: validSiret };
      const createdStatut = await createStatutCandidat(statutWithValidSiret);

      assert.strictEqual(createdStatut.siret_etablissement_valid, true);
    });

    it("Vérifie la création d'un statut avec un uai invalide", async () => {
      const { createStatutCandidat } = await statutsCandidats();

      const statutWithInvalidUai = { ...createRandomStatutCandidat(), uai_etablissement: "invalid-uai" };
      const createdStatut = await createStatutCandidat(statutWithInvalidUai);

      assert.strictEqual(createdStatut.uai_etablissement_valid, false);
    });

    it("Vérifie la création d'un statut avec un uai valide", async () => {
      const { createStatutCandidat } = await statutsCandidats();

      const validUai = "0123456Z";
      const statutWithInvalidUai = { ...createRandomStatutCandidat(), uai_etablissement: validUai };
      const createdStatut = await createStatutCandidat(statutWithInvalidUai);

      assert.strictEqual(createdStatut.uai_etablissement_valid, true);
    });

    it("Vérifie la création d'un statut avec un cfd invalide", async () => {
      const { createStatutCandidat } = await statutsCandidats();

      const invalidCfd = "0123";
      const statutWithInvalidUai = { ...createRandomStatutCandidat(), formation_cfd: invalidCfd };
      const createdStatut = await createStatutCandidat(statutWithInvalidUai);

      assert.strictEqual(createdStatut.formation_cfd_valid, false);
    });

    it("Vérifie la création d'un statut avec un cfd valide", async () => {
      const { createStatutCandidat } = await statutsCandidats();

      const validCfd = "abcd1234";
      const statutWithInvalidUai = { ...createRandomStatutCandidat(), formation_cfd: validCfd };
      const createdStatut = await createStatutCandidat(statutWithInvalidUai);

      assert.strictEqual(createdStatut.formation_cfd_valid, true);
    });

    it("Vérifie qu'à la création d'un statut avec un siret invalide on ne set pas le champ etablissement_reseaux", async () => {
      const { createStatutCandidat } = await statutsCandidats();
      const invalidSiret = "invalid";

      // Create sample cfa in referentiel
      const referenceCfa = new Cfa({
        sirets: [invalidSiret],
        reseaux: [reseauxCfas.ANASUP.nomReseau, reseauxCfas.BTP_CFA.nomReseau],
      });
      await referenceCfa.save();

      // Create statut
      const statutWithInvalidSiret = { ...createRandomStatutCandidat(), siret_etablissement: invalidSiret };
      const createdStatut = await createStatutCandidat(statutWithInvalidSiret);

      // Check uai & reseaux in created statut
      const { siret_etablissement_valid, etablissement_reseaux } = createdStatut;
      assert.deepStrictEqual(siret_etablissement_valid, false);
      assert.deepStrictEqual(etablissement_reseaux.length, 0);
    });

    it("Vérifie qu'à la création d'un statut avec un uai valide on set le champ etablissement_reseaux et qu'on récupère le réseau depuis le referentiel CFA ", async () => {
      const { createStatutCandidat } = await statutsCandidats();
      const validUai = "0631450J";

      // Create sample cfa in referentiel
      const referenceCfa = new Cfa({
        uai: validUai,
        reseaux: [reseauxCfas.ANASUP.nomReseau, reseauxCfas.BTP_CFA.nomReseau],
      });
      await referenceCfa.save();

      // Create statut
      const statutWithValidUai = { ...createRandomStatutCandidat(), uai_etablissement: validUai };
      const createdStatut = await createStatutCandidat(statutWithValidUai);

      // Check uai & reseaux in created statut
      const { uai_etablissement_valid, etablissement_reseaux } = createdStatut;
      assert.deepStrictEqual(uai_etablissement_valid, true);
      assert.deepStrictEqual(etablissement_reseaux.length, 2);
      assert.deepStrictEqual(etablissement_reseaux[0], reseauxCfas.ANASUP.nomReseau);
      assert.deepStrictEqual(etablissement_reseaux[1], reseauxCfas.BTP_CFA.nomReseau);
    });

    it("Vérifie qu'à la création d'un statut avec un uai invalide on ne set pas le champ etablissement_reseaux", async () => {
      const { createStatutCandidat } = await statutsCandidats();
      const invalidUai = "invalid";

      // Create sample cfa in referentiel
      const referenceCfa = new Cfa({
        uai: invalidUai,
        reseaux: [reseauxCfas.ANASUP.nomReseau, reseauxCfas.BTP_CFA.nomReseau],
      });
      await referenceCfa.save();

      // Create statut
      const statutWithInvalidUai = { ...createRandomStatutCandidat(), uai_etablissement: invalidUai };
      const createdStatut = await createStatutCandidat(statutWithInvalidUai);

      // Check uai & reseaux in created statut
      const { uai_etablissement_valid, etablissement_reseaux } = createdStatut;
      assert.deepStrictEqual(uai_etablissement_valid, false);
      assert.deepStrictEqual(etablissement_reseaux.length, 0);
    });

    it("Vérifie qu'à la création d'un statut avec un CFD valide on crée la formation correspondante si elle n'existe pas", async () => {
      const { createStatutCandidat } = await statutsCandidats();

      // Create statut
      const cfd = "01022104";
      const statutWithValidCfd = { ...createRandomStatutCandidat(), formation_cfd: cfd };
      const createdStatut = await createStatutCandidat(statutWithValidCfd);

      assert.ok(createdStatut);
      // Check that formation was created
      const foundFormations = await Formation.find();
      assert.deepEqual(foundFormations.length, 1);
      assert.deepEqual(foundFormations[0].cfd, cfd);
    });

    it("Vérifie qu'à la création d'un statut avec un CFD valide on ne crée pas de formation si elle existe", async () => {
      const { createStatutCandidat } = await statutsCandidats();

      const cfd = "01022104";
      // Create formation
      const formation = await new Formation({ cfd }).save();

      // Create statut
      const statutWithValidCfd = { ...createRandomStatutCandidat(), formation_cfd: cfd };
      const createdStatut = await createStatutCandidat(statutWithValidCfd);

      assert.ok(createdStatut);
      // Check that new formation was not created
      const foundFormations = await Formation.find();
      assert.deepEqual(foundFormations.length, 1);
      assert.deepEqual(foundFormations[0].created_at, formation.created_at);
    });

    it("Vérifie qu'on peut créer un statut sans annee_scolaire", async () => {
      const { createStatutCandidat } = await statutsCandidats();

      // Create statut
      const statutWithoutAnneeScolaire = { ...createRandomStatutCandidat(), annee_scolaire: undefined };
      const createdStatut = await createStatutCandidat(statutWithoutAnneeScolaire);

      assert.ok(createdStatut);
      assert.equal(createdStatut.prenom_apprenant, statutWithoutAnneeScolaire.prenom_apprenant);
      assert.equal(createdStatut.nom_apprenant, statutWithoutAnneeScolaire.nom_apprenant);
      assert.equal(createdStatut.formation_cfd, statutWithoutAnneeScolaire.formation_cfd);
      assert.equal(createdStatut.uai_etablissement, statutWithoutAnneeScolaire.uai_etablissement);
    });
  });

  describe("getDuplicatesList", () => {
    it("Vérifie la récupération des doublons de statuts candidats", async () => {
      const { createStatutCandidat, getDuplicatesList } = await statutsCandidats();

      // Create 10 random statuts
      for (let index = 0; index < 5; index++) {
        await createStatutCandidat(createRandomStatutCandidat());
      }

      // Create 3 duplicates
      const commonData = {
        formation_cfd: "01022103",
        uai_etablissement: "0762518Z",
        prenom_apprenant: "Jean",
        nom_apprenant: "Dupont",
        annee_scolaire: "2022-2023",
      };
      for (let index = 0; index < 3; index++) {
        await createStatutCandidat(createRandomStatutCandidat(commonData));
      }

      const duplicatesListFound = await getDuplicatesList(duplicatesTypesCodes.unique.code);

      // 1 cas de doublons trouvé
      assert.equal(duplicatesListFound.length, 1);
      assert.equal(duplicatesListFound[0].duplicatesCount, 3);
      assert.equal(duplicatesListFound[0].duplicatesIds.length, 3);
      assert.deepEqual(duplicatesListFound[0].commonData, commonData);
    });

    it("Vérifie la récupération de statuts candidats ayant le même nom_apprenant, uai_etablissement, formation_cfd", async () => {
      const { createStatutCandidat, getDuplicatesList } = await statutsCandidats();

      // Create 10 random statuts
      for (let index = 0; index < 5; index++) {
        await createStatutCandidat(createRandomStatutCandidat());
      }

      // Create 4 statuts with same nom_apprenant, uai_etablissement, formation_cfd
      const commonData = {
        formation_cfd: "01022103",
        uai_etablissement: "0762518Z",
        nom_apprenant: "Wachosky",
        annee_scolaire: "2020-2021",
      };
      for (let index = 0; index < 4; index++) {
        await createStatutCandidat(createRandomStatutCandidat(commonData));
      }

      const duplicatesListFound = await getDuplicatesList(duplicatesTypesCodes.prenom_apprenant.code);

      // 1 cas de doublons trouvé
      assert.equal(duplicatesListFound.length, 1);
      assert.equal(duplicatesListFound[0].duplicatesCount, 4);
      assert.equal(duplicatesListFound[0].duplicatesIds.length, 4);
      assert.deepEqual(duplicatesListFound[0].commonData, commonData);
      assert.deepEqual(duplicatesListFound[0].discriminants.prenom_apprenants.length, 4);
    });

    it("Vérifie la récupération des doublons de statuts candidats n'ayant jamais eu d'update", async () => {
      const { createStatutCandidat, addOrUpdateStatuts, getDuplicatesList } = await statutsCandidats();

      // Create 10 random statuts
      for (let index = 0; index < 0; index++) {
        await createStatutCandidat(createRandomStatutCandidat());
      }

      // Create 2 duplicates for Jean Dupont
      const firstDup = {
        formation_cfd: "01022103",
        uai_etablissement: "0762518Z",
        prenom_apprenant: "Jean",
        nom_apprenant: "Dupont",
        annee_scolaire: "2022-2023",
        statut_apprenant: 2,
      };
      await createStatutCandidat(createRandomStatutCandidat(firstDup));
      await createStatutCandidat(createRandomStatutCandidat(firstDup));

      // create 2 duplicates with a different statut_apprenant
      const secondDup = {
        formation_cfd: "01022105",
        uai_etablissement: "0769999P",
        prenom_apprenant: "Marie",
        nom_apprenant: "Durand",
        annee_scolaire: "2021-2022",
        statut_apprenant: 2,
      };
      await createStatutCandidat(createRandomStatutCandidat(secondDup));
      await createStatutCandidat(createRandomStatutCandidat({ ...secondDup, statut_apprenant: 3 }));

      // create 2 duplicates and update one of them
      const thirdDups = {
        formation_cfd: "01022106",
        uai_etablissement: "0769888P",
        prenom_apprenant: "John",
        nom_apprenant: "Doe",
        annee_scolaire: "2021-2022",
        statut_apprenant: 2,
      };
      await createStatutCandidat(createRandomStatutCandidat(thirdDups));
      await createStatutCandidat(createRandomStatutCandidat(thirdDups));
      await addOrUpdateStatuts([createRandomStatutCandidat({ ...thirdDups, statut_apprenant: 3 })]);

      const duplicatesListFound = await getDuplicatesList(
        duplicatesTypesCodes.unique.code,
        {},
        { duplicatesWithNoUpdate: true }
      );

      // 1 cas de doublons trouvé
      assert.equal(duplicatesListFound.length, 1);
      assert.equal(duplicatesListFound[0].duplicatesCount, 2);
      assert.equal(duplicatesListFound[0].duplicatesIds.length, 2);
      assert.deepEqual(duplicatesListFound[0].commonData.prenom_apprenant, firstDup.prenom_apprenant);
      assert.deepEqual(duplicatesListFound[0].commonData.nom_apprenant, firstDup.nom_apprenant);
    });
  });
});
