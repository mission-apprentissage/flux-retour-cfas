const assert = require("assert").strict;
const { addDays, differenceInMilliseconds, isEqual } = require("date-fns");
const integrationTests = require("../../../utils/integrationTests");
const statutsCandidats = require("../../../../src/common/components/statutsCandidats");
const { StatutCandidatModel, CfaModel, FormationModel } = require("../../../../src/common/model");
const { codesStatutsCandidats } = require("../../../../src/common/model/constants");
const { statutsTest, statutsTestUpdate, simpleStatut } = require("../../../data/sample");
const { createRandomStatutCandidat, getRandomUaiEtablissement } = require("../../../data/randomizedSample");
const { reseauxCfas, duplicatesTypesCodes } = require("../../../../src/common/model/constants");
const { nockGetCfdInfo } = require("../../../utils/nockApis/nock-tablesCorrespondances");
const { nockGetMetiersByCfd } = require("../../../utils/nockApis/nock-Lba");

const isApproximatelyNow = (date) => {
  return Math.abs(differenceInMilliseconds(date, new Date())) < 50;
};

integrationTests(__filename, () => {
  beforeEach(() => {
    nockGetCfdInfo();
    nockGetMetiersByCfd();
  });

  describe("getStatut", () => {
    it("Vérifie la récupération d'un statut sur nom, prenom, formation_cfd, uai_etablissement et annee_scolaire", async () => {
      const { getStatut, createStatutCandidat } = await statutsCandidats();

      const randomStatutProps = createRandomStatutCandidat();
      const createdStatut = await createStatutCandidat(randomStatutProps);

      const found = await getStatut({
        nom_apprenant: randomStatutProps.nom_apprenant,
        prenom_apprenant: randomStatutProps.prenom_apprenant,
        formation_cfd: randomStatutProps.formation_cfd,
        uai_etablissement: randomStatutProps.uai_etablissement,
        annee_scolaire: randomStatutProps.annee_scolaire,
      });

      assert.equal(found._id.equals(createdStatut._id.toString()), true);
    });

    it("Vérifie que la récupération d'un statut est insensible à la casse de nom_apprenant", async () => {
      const { getStatut, createStatutCandidat } = await statutsCandidats();

      const randomStatutProps = createRandomStatutCandidat({
        nom_apprenant: "SMITH",
      });
      const createdStatut = await createStatutCandidat(randomStatutProps);

      const found = await getStatut({
        nom_apprenant: "Smith",
        prenom_apprenant: randomStatutProps.prenom_apprenant,
        formation_cfd: randomStatutProps.formation_cfd,
        uai_etablissement: randomStatutProps.uai_etablissement,
        annee_scolaire: randomStatutProps.annee_scolaire,
      });

      assert.equal(found._id.equals(createdStatut._id.toString()), true);
    });

    it("Vérifie que la récupération d'un statut est insensible à la casse de prenom_apprenant", async () => {
      const { getStatut, createStatutCandidat } = await statutsCandidats();

      const randomStatutProps = createRandomStatutCandidat({
        prenom_apprenant: "John Abdoul-Bæstoï*",
      });
      const createdStatut = await createStatutCandidat(randomStatutProps);

      const found = await getStatut({
        nom_apprenant: randomStatutProps.nom_apprenant,
        prenom_apprenant: "jOhN AbDoUl-BÆSTOÏ*",
        formation_cfd: randomStatutProps.formation_cfd,
        uai_etablissement: randomStatutProps.uai_etablissement,
        annee_scolaire: randomStatutProps.annee_scolaire,
      });

      assert.equal(found._id.equals(createdStatut._id.toString()), true);
    });

    const unicityCriterion = [
      "nom_apprenant",
      "prenom_apprenant",
      "uai_etablissement",
      "formation_cfd",
      "annee_scolaire",
    ];

    unicityCriterion.forEach((unicityCriteria) => {
      it(`Vérifie qu'on ne trouve pas le statut créé quand ${unicityCriteria} a changé`, async () => {
        const { getStatut, createStatutCandidat } = await statutsCandidats();

        const randomStatutProps = createRandomStatutCandidat();
        await createStatutCandidat(randomStatutProps);

        const found = await getStatut({
          nom_apprenant: randomStatutProps.nom_apprenant,
          prenom_apprenant: randomStatutProps.prenom_apprenant,
          formation_cfd: randomStatutProps.formation_cfd,
          uai_etablissement: randomStatutProps.uai_etablissement,
          annee_scolaire: randomStatutProps.annee_scolaire,
          [unicityCriteria]: "changed",
        });
        assert.equal(found, null);
      });
    });
  });

  describe("addOrUpdateStatuts", () => {
    it("Vérifie l'ajout ou la mise à jour d'un statut'", async () => {
      const { addOrUpdateStatuts } = await statutsCandidats();

      // Add statuts test
      await addOrUpdateStatuts(statutsTest);

      // Checks addOrUpdateStatuts method
      assert.equal(await StatutCandidatModel.countDocuments({}), statutsTest.length);
      const { added, updated } = await addOrUpdateStatuts(statutsTestUpdate);

      // Check added
      assert.equal(added.length, 1);
      const foundAdded = await StatutCandidatModel.findById(added[0]._id).lean();
      assert.equal(foundAdded.ine_apprenant, statutsTestUpdate[3].ine_apprenant);
      assert.equal(foundAdded.nom_apprenant.toUpperCase(), statutsTestUpdate[3].nom_apprenant.toUpperCase());
      assert.equal(foundAdded.prenom_apprenant.toUpperCase(), statutsTestUpdate[3].prenom_apprenant.toUpperCase());
      assert.equal(foundAdded.ne_pas_solliciter, statutsTestUpdate[3].ne_pas_solliciter);
      assert.equal(foundAdded.email_contact, statutsTestUpdate[3].email_contact);
      assert.equal(foundAdded.formation_cfd, statutsTestUpdate[3].formation_cfd);
      assert.equal(foundAdded.uai_etablissement, statutsTestUpdate[3].uai_etablissement);
      assert.equal(foundAdded.siret_etablissement, statutsTestUpdate[3].siret_etablissement);
      assert.equal(foundAdded.statut_apprenant, statutsTestUpdate[3].statut_apprenant);
      assert.equal(foundAdded.updated_at, null);
      assert.equal(foundAdded.annee_formation, statutsTestUpdate[3].annee_formation);
      assert.equal(foundAdded.annee_scolaire, statutsTestUpdate[3].annee_scolaire);
      assert.deepEqual(foundAdded.periode_formation, statutsTestUpdate[3].periode_formation);

      // Check updated
      assert.equal(updated.length, 3);

      const firstUpdated = await StatutCandidatModel.findById(updated[0]._id).lean();
      assert.equal(firstUpdated.ine_apprenant, statutsTestUpdate[0].ine_apprenant);
      assert.equal(firstUpdated.nom_apprenant.toUpperCase(), statutsTestUpdate[0].nom_apprenant.toUpperCase());
      assert.equal(firstUpdated.prenom_apprenant.toUpperCase(), statutsTestUpdate[0].prenom_apprenant.toUpperCase());
      assert.equal(firstUpdated.ne_pas_solliciter, statutsTestUpdate[0].ne_pas_solliciter);
      assert.equal(firstUpdated.email_contact, statutsTestUpdate[0].email_contact);
      assert.equal(firstUpdated.formation_cfd, statutsTestUpdate[0].formation_cfd);
      assert.equal(firstUpdated.libelle_court_formation, statutsTestUpdate[0].libelle_court_formation);
      assert.equal(firstUpdated.libelle_long_formation, statutsTestUpdate[0].libelle_long_formation);
      assert.equal(firstUpdated.uai_etablissement, statutsTestUpdate[0].uai_etablissement);
      assert.equal(firstUpdated.siret_etablissement, statutsTestUpdate[0].siret_etablissement);
      assert.equal(firstUpdated.nom_etablissement, statutsTestUpdate[0].nom_etablissement);
      assert.equal(firstUpdated.statut_apprenant, statutsTestUpdate[0].statut_apprenant);
      assert.equal(firstUpdated.annee_scolaire, statutsTestUpdate[0].annee_scolaire);
      assert.ok(firstUpdated.updated_at);

      const secondUpdated = await StatutCandidatModel.findById(updated[1]._id).lean();
      assert.equal(secondUpdated.ine_apprenant, statutsTestUpdate[1].ine_apprenant);
      assert.equal(secondUpdated.nom_apprenant.toUpperCase(), statutsTestUpdate[1].nom_apprenant.toUpperCase());
      assert.equal(secondUpdated.prenom_apprenant.toUpperCase(), statutsTestUpdate[1].prenom_apprenant.toUpperCase());
      assert.equal(secondUpdated.ne_pas_solliciter, statutsTestUpdate[1].ne_pas_solliciter);
      assert.equal(secondUpdated.email_contact, statutsTestUpdate[1].email_contact);
      assert.equal(secondUpdated.formation_cfd, statutsTestUpdate[1].formation_cfd);
      assert.equal(secondUpdated.uai_etablissement, statutsTestUpdate[1].uai_etablissement);
      assert.equal(secondUpdated.siret_etablissement, statutsTestUpdate[1].siret_etablissement);
      assert.equal(secondUpdated.nom_etablissement, statutsTestUpdate[1].nom_etablissement);
      assert.equal(secondUpdated.statut_apprenant, statutsTestUpdate[1].statut_apprenant);
      assert.equal(secondUpdated.annee_scolaire, statutsTestUpdate[1].annee_scolaire);
      assert.ok(secondUpdated.updated_at);

      const thirdUpdated = await StatutCandidatModel.findById(updated[2]._id).lean();
      assert.equal(thirdUpdated.nom_apprenant.toUpperCase(), statutsTestUpdate[2].nom_apprenant.toUpperCase());
      assert.equal(thirdUpdated.prenom_apprenant.toUpperCase(), statutsTestUpdate[2].prenom_apprenant.toUpperCase());
      assert.equal(thirdUpdated.ne_pas_solliciter, statutsTestUpdate[2].ne_pas_solliciter);
      assert.equal(thirdUpdated.email_contact, statutsTestUpdate[2].email_contact);
      assert.equal(thirdUpdated.formation_cfd, statutsTestUpdate[2].formation_cfd);
      assert.equal(thirdUpdated.uai_etablissement, statutsTestUpdate[2].uai_etablissement);
      assert.equal(thirdUpdated.siret_etablissement, statutsTestUpdate[2].siret_etablissement);
      assert.equal(thirdUpdated.nom_etablissement, statutsTestUpdate[2].nom_etablissement);
      assert.equal(thirdUpdated.statut_apprenant, statutsTestUpdate[2].statut_apprenant);
      assert.equal(thirdUpdated.annee_scolaire, statutsTestUpdate[2].annee_scolaire);
      assert.ok(thirdUpdated.updated_at);
    });

    it("Vérifie qu'on peut créer un statut sans annee_scolaire", async () => {
      const { addOrUpdateStatuts } = await statutsCandidats();
      const randomStatut = createRandomStatutCandidat();
      delete randomStatut.annee_scolaire;

      const result = await addOrUpdateStatuts([randomStatut]);
      assert.equal(result.added.length, 1);
      assert.equal(result.updated.length, 0);
      assert.equal(await StatutCandidatModel.countDocuments(), 1);
    });

    it("Vérifie qu'on update le siret_etablissement d'un statut existant qui n'en a pas avec le SIRET de l'élément passé si le reste des infos est identique", async () => {
      const { addOrUpdateStatuts } = await statutsCandidats();

      const statutWithoutSiret = { ...createRandomStatutCandidat(), siret_etablissement: null };
      const result = await addOrUpdateStatuts([statutWithoutSiret]);
      assert.equal(result.added.length, 1);
      assert.equal(result.updated.length, 0);

      // send the same statut but with a siret
      const sameStatutWithSiret = { ...statutWithoutSiret, siret_etablissement: "12312312300099" };
      const { added, updated } = await addOrUpdateStatuts([sameStatutWithSiret]);

      // statut should have been updated
      assert.equal(added.length, 0, "added problem");
      assert.equal(updated.length, 1);
      const count = await StatutCandidatModel.countDocuments();
      assert.equal(count, 1);

      // check in db
      const found = await StatutCandidatModel.findById(result.added[0]._id);
      assert.equal(found.siret_etablissement, "12312312300099");
      assert.notEqual(found.updated_at, null);
    });

    it("Vérifie qu'un changement sur le champ periode_formation d'un statut existant est considéré comme un update", async () => {
      const { addOrUpdateStatuts } = await statutsCandidats();

      const statutWithoutPeriodeFormation = createRandomStatutCandidat({ periode_formation: null });
      const result = await addOrUpdateStatuts([statutWithoutPeriodeFormation]);
      assert.equal(result.added.length, 1);
      assert.equal(result.updated.length, 0);

      // send the same statut but with a different periode_formation
      const sameStatutWithPeriodeFormation = { ...statutWithoutPeriodeFormation, periode_formation: [2021, 2022] };
      const { added, updated } = await addOrUpdateStatuts([sameStatutWithPeriodeFormation]);

      // statut should have been updated
      assert.equal(added.length, 0);
      assert.equal(updated.length, 1);
      const count = await StatutCandidatModel.countDocuments();
      assert.equal(count, 1);

      // check in db
      const found = await StatutCandidatModel.findById(result.added[0]._id).lean();
      assert.deepEqual(found.periode_formation, [2021, 2022]);
      assert.notEqual(found.updated_at, null);
    });

    it("Vérifie qu'un changement sur le champ annee_formation d'un statut existant est considéré comme un update", async () => {
      const { addOrUpdateStatuts } = await statutsCandidats();

      const statutWithoutAnneeFormation = createRandomStatutCandidat({ annee_formation: null });
      const result = await addOrUpdateStatuts([statutWithoutAnneeFormation]);
      assert.equal(result.added.length, 1);
      assert.equal(result.updated.length, 0);

      // send the same statut but with a different annee_formation
      const sameStatutWithAnneeFormation = { ...statutWithoutAnneeFormation, annee_formation: 2020 };
      const { added, updated } = await addOrUpdateStatuts([sameStatutWithAnneeFormation]);

      // statut should have been updated
      assert.equal(added.length, 0);
      assert.equal(updated.length, 1);
      const count = await StatutCandidatModel.countDocuments();
      assert.equal(count, 1);

      // check in db
      const found = await StatutCandidatModel.findById(result.added[0]._id).lean();
      assert.equal(found.annee_formation, 2020);
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
      assert.equal(firstCallResult.added.length, 1);
      assert.equal(firstCallResult.updated.length, 0);

      // send the same statut information but with a different nom
      const sameStatutInformationWithDifferentNom = { ...uniqueStatutToCreate, nom_apprenant: sampleNom2 };
      const secondCallResult = await addOrUpdateStatuts([sameStatutInformationWithDifferentNom]);

      // a new statut should have been created
      assert.equal(secondCallResult.added.length, 1);
      assert.equal(secondCallResult.updated.length, 0);
      const count = await StatutCandidatModel.countDocuments();
      assert.equal(count, 2);

      // check in db
      const found = await StatutCandidatModel.findById(firstCallResult.added[0]._id);
      assert.equal(found.nom_apprenant, sampleNom);
      assert.equal(found.updated_at, null);
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
      assert.equal(firstCallResult.added.length, 1);
      assert.equal(firstCallResult.updated.length, 0);

      // send the same statut but with a different prenom
      const sameStatutWithDifferentPrenom = { ...uniqueStatutToCreate, prenom_apprenant: samplePrenom2 };
      const secondCallResult = await addOrUpdateStatuts([sameStatutWithDifferentPrenom]);

      // a new statut should have been created
      assert.equal(secondCallResult.added.length, 1);
      assert.equal(secondCallResult.updated.length, 0);
      const count = await StatutCandidatModel.countDocuments();
      assert.equal(count, 2);

      // check in db
      const found = await StatutCandidatModel.findById(firstCallResult.added[0]._id);
      assert.equal(found.prenom_apprenant, samplePrenom.toUpperCase());
      assert.equal(found.updated_at, null);
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
      assert.equal(firstCallResult.added.length, 1);
      assert.equal(firstCallResult.updated.length, 0);

      // send the same statut but with a different cfd
      const sameStatutWithDifferentCfd = { ...uniqueStatutToCreate, formation_cfd: validCfd2 };
      const secondCallResult = await addOrUpdateStatuts([sameStatutWithDifferentCfd]);

      // a new statut should have been created
      assert.equal(secondCallResult.added.length, 1);
      assert.equal(secondCallResult.updated.length, 0);
      const count = await StatutCandidatModel.countDocuments();
      assert.equal(count, 2);

      // check in db
      const found = await StatutCandidatModel.findById(firstCallResult.added[0]._id);
      assert.equal(found.formation_cfd, validCfd);
      assert.equal(found.updated_at, null);
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
      const count = await StatutCandidatModel.countDocuments();
      assert.equal(count, 2);

      // check in db that first created element was not updated
      const found = await StatutCandidatModel.findById(firstCallResult.added[0]._id);
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
      assert.equal(firstCallResult.added.length, 1);
      assert.equal(firstCallResult.updated.length, 0);

      // send the same statut information but with a different uai
      const sameStatutWithDifferentUai = { ...uniqueStatutToCreate, uai_etablissement: validUai2 };
      const secondCallResult = await addOrUpdateStatuts([sameStatutWithDifferentUai]);

      // a new statut should have been created
      assert.equal(secondCallResult.added.length, 1);
      assert.equal(secondCallResult.updated.length, 0);
      const count = await StatutCandidatModel.countDocuments();
      assert.equal(count, 2);

      // check in db
      const found = await StatutCandidatModel.findById(firstCallResult.added[0]._id);
      assert.equal(found.uai_etablissement, validUai);
      assert.equal(found.updated_at, null);
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
      assert.equal(firstCallResult.added.length, 1);
      assert.equal(firstCallResult.updated.length, 0);

      // send the same statut but with a different periode_formation
      const sameStatutWithDifferentPeriode = { ...uniqueStatutToCreate, periode_formation: samplePeriode2 };
      const secondCallResult = await addOrUpdateStatuts([sameStatutWithDifferentPeriode]);

      // no new statut should have been created
      assert.equal(secondCallResult.added.length, 0);
      assert.equal(secondCallResult.updated.length, 1);
      const count = await StatutCandidatModel.countDocuments();
      assert.equal(count, 1);

      // check in db
      const found = await StatutCandidatModel.findById(firstCallResult.added[0]._id);
      assert.deepEqual(found.periode_formation.join(), samplePeriode2.join());
      assert.notEqual(found.updated_at, null);
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
      assert.equal(firstCallResult.added.length, 1);
      assert.equal(firstCallResult.updated.length, 0);

      // send the same statut but with a different annee_formation
      const sameStatutWithDifferentAnnee = { ...uniqueStatutToCreate, annee_formation: sampleAnnee2 };
      const secondCallResult = await addOrUpdateStatuts([sameStatutWithDifferentAnnee]);

      // no new statut should have been created
      assert.equal(secondCallResult.added.length, 0);
      assert.equal(secondCallResult.updated.length, 1);
      const count = await StatutCandidatModel.countDocuments();
      assert.equal(count, 1);

      // check in db
      const found = await StatutCandidatModel.findById(firstCallResult.added[0]._id);
      assert.equal(found.annee_formation, sampleAnnee2);
      assert.notEqual(found.updated_at, null);
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
      assert.equal(firstCallResult.added.length, 1);
      assert.equal(firstCallResult.updated.length, 0);

      // send the same statut but with a different siret_etablissement
      const sameStatutWithDifferentAnnee = { ...uniqueStatutToCreate, siret_etablissement: siret_etablissement2 };
      const secondCallResult = await addOrUpdateStatuts([sameStatutWithDifferentAnnee]);

      // no new statut should have been created
      assert.equal(secondCallResult.added.length, 0);
      assert.equal(secondCallResult.updated.length, 1);
      const count = await StatutCandidatModel.countDocuments();
      assert.equal(count, 1);

      const found = await StatutCandidatModel.findById(firstCallResult.added[0]._id);
      assert.equal(found.siret_etablissement, siret_etablissement2);
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
      assert.equal(firstCallResult.added.length, 1);
      assert.equal(firstCallResult.updated.length, 0);

      // send the same statut but with updates on prenom2-3 & email
      const sameStatutWithUpdatesPrenomEmail = {
        ...uniqueStatutToCreate,
        email_contact: updatedEmail,
      };
      const secondCallResult = await addOrUpdateStatuts([sameStatutWithUpdatesPrenomEmail]);

      // no new statut should have been created but update only
      assert.equal(secondCallResult.added.length, 0);
      assert.equal(secondCallResult.updated.length, 1);
      const count = await StatutCandidatModel.countDocuments();
      assert.equal(count, 1);

      // check in db
      const found = await StatutCandidatModel.findById(firstCallResult.added[0]._id);
      assert.equal(found.email_contact, updatedEmail);
      assert.notEqual(found.updated_at, null);
    });
  });

  describe("updateStatutCandidat", () => {
    it("Vérifie qu'on ne peut pas update le champ prenom_apprenant", async () => {
      const { updateStatut, createStatutCandidat } = await statutsCandidats();

      const createdStatut = await createStatutCandidat(
        createRandomStatutCandidat({
          prenom_apprenant: "John",
        })
      );
      assert.equal(createdStatut.updated_at, null);

      // First update
      await updateStatut(createdStatut._id, { prenom_apprenant: "André-Pierre" });
      // Check value in db
      const foundAfterUpdate = await StatutCandidatModel.findById(createdStatut._id);
      assert.equal(foundAfterUpdate.prenom_apprenant, createdStatut.prenom_apprenant);
    });

    it("Vérifie qu'on ne peut pas update le champ nom_apprenant", async () => {
      const { updateStatut, createStatutCandidat } = await statutsCandidats();

      const createdStatut = await createStatutCandidat(
        createRandomStatutCandidat({
          nom_apprenant: "Macron",
        })
      );
      assert.equal(createdStatut.updated_at, null);

      // First update
      await updateStatut(createdStatut._id, { nom_apprenant: "Philippe" });
      // Check value in db
      const foundAfterUpdate = await StatutCandidatModel.findById(createdStatut._id);
      assert.equal(foundAfterUpdate.nom_apprenant, createdStatut.nom_apprenant);
    });

    it("Vérifie qu'on ne peut pas update le champ annee_scolaire", async () => {
      const { updateStatut, createStatutCandidat } = await statutsCandidats();

      const createdStatut = await createStatutCandidat(
        createRandomStatutCandidat({
          annee_scolaire: "2021-2022",
        })
      );
      assert.equal(createdStatut.updated_at, null);

      // First update
      await updateStatut(createdStatut._id, { annee_scolaire: "2022-2023" });
      // Check value in db
      const foundAfterUpdate = await StatutCandidatModel.findById(createdStatut._id);
      assert.equal(foundAfterUpdate.annee_scolaire, createdStatut.annee_scolaire);
    });

    it("Vérifie qu'on ne peut pas update le champ uai_etablissement", async () => {
      const { updateStatut, createStatutCandidat } = await statutsCandidats();

      const createdStatut = await createStatutCandidat(
        createRandomStatutCandidat({
          uai_etablissement: "0123456Z",
        })
      );
      assert.equal(createdStatut.updated_at, null);

      // First update
      await updateStatut(createdStatut._id, { uai_etablissement: "0123499X" });
      // Check value in db
      const foundAfterUpdate = await StatutCandidatModel.findById(createdStatut._id);
      assert.equal(foundAfterUpdate.uai_etablissement, createdStatut.uai_etablissement);
    });

    it("Vérifie qu'on ne peut pas update le champ formation_cfd", async () => {
      const { updateStatut, createStatutCandidat } = await statutsCandidats();

      const createdStatut = await createStatutCandidat(
        createRandomStatutCandidat({
          formation_cfd: "abcd1234",
        })
      );
      assert.equal(createdStatut.updated_at, null);

      // First update
      await updateStatut(createdStatut._id, { formation_cfd: "abcd9999" });
      // Check value in db
      const foundAfterUpdate = await StatutCandidatModel.findById(createdStatut._id);
      assert.equal(foundAfterUpdate.formation_cfd, createdStatut.formation_cfd);
    });

    it("Vérifie qu'on update PAS historique_statut_apprenant quand un statut_apprenant identique à l'actuel est envoyé", async () => {
      const { updateStatut, createStatutCandidat } = await statutsCandidats();

      const createdStatut = await createStatutCandidat(simpleStatut);

      assert.equal(createdStatut.historique_statut_apprenant.length, 1);
      assert.equal(createdStatut.historique_statut_apprenant[0].valeur_statut, createdStatut.statut_apprenant);
      assert.equal(isApproximatelyNow(createdStatut.historique_statut_apprenant[0].date_reception), true);

      // Mise à jour du statut avec le même statut_apprenant
      await updateStatut(createdStatut._id, { statut_apprenant: simpleStatut.statut_apprenant });

      // Check value in db
      const found = await StatutCandidatModel.findById(createdStatut._id);
      assert.equal(found.historique_statut_apprenant.length, 1);
    });

    it("Vérifie qu'on update historique_statut_apprenant quand un NOUVEAU statut_apprenant est envoyé", async () => {
      const { updateStatut, createStatutCandidat } = await statutsCandidats();

      const createdStatut = await createStatutCandidat(simpleStatut);

      assert.equal(createdStatut.historique_statut_apprenant.length, 1);
      assert.equal(createdStatut.historique_statut_apprenant[0].valeur_statut, createdStatut.statut_apprenant);
      assert.equal(isApproximatelyNow(createdStatut.historique_statut_apprenant[0].date_reception), true);

      // Mise à jour du statut avec nouveau statut_apprenant
      const updatePayload = {
        statut_apprenant: codesStatutsCandidats.abandon,
        date_metier_mise_a_jour_statut: new Date().toISOString(),
      };
      await updateStatut(createdStatut._id, updatePayload);

      // Check value in db
      const found = await StatutCandidatModel.findById(createdStatut._id);
      const updatedHistorique = found.historique_statut_apprenant;
      assert.equal(updatedHistorique.length, 2);
      assert.equal(updatedHistorique[0].valeur_statut, createdStatut.statut_apprenant);
      assert.equal(updatedHistorique[1].valeur_statut, codesStatutsCandidats.abandon);
      assert.equal(
        updatedHistorique[1].date_statut.getTime(),
        new Date(updatePayload.date_metier_mise_a_jour_statut).getTime()
      );
      assert.equal(isApproximatelyNow(updatedHistorique[1].date_reception), true);
      assert.equal(isEqual(updatedHistorique[1].date_reception, updatedHistorique[0].date_reception), false);
    });

    it("Vérifie qu'on update historique_statut_apprenant en supprimant les éléments d'historique postérieurs à la date_metier_mise_a_jour_statut envoyée", async () => {
      const { updateStatut, createStatutCandidat } = await statutsCandidats();

      const createdStatut = await createStatutCandidat(simpleStatut);
      // update created statut to add an element with date_statut 90 days after now date
      await updateStatut(createdStatut._id, {
        ...simpleStatut,
        date_metier_mise_a_jour_statut: addDays(new Date(), 90),
        statut_apprenant: codesStatutsCandidats.inscrit,
      });

      const found1 = await StatutCandidatModel.findById(createdStatut._id);
      assert.equal(found1.historique_statut_apprenant.length, 2);
      assert.equal(found1.historique_statut_apprenant[1].valeur_statut, codesStatutsCandidats.inscrit);
      assert.equal(isApproximatelyNow(found1.historique_statut_apprenant[1].date_reception), true);

      // update du statut avec une date antérieur au dernier élément de historique_statut_apprenant
      const updatePayload = {
        statut_apprenant: codesStatutsCandidats.abandon,
        date_metier_mise_a_jour_statut: new Date(),
      };
      await updateStatut(createdStatut._id, { ...simpleStatut, ...updatePayload });

      // historique should contain the new element and the one date with a later date should be removed
      const found2 = await StatutCandidatModel.findById(createdStatut._id);
      assert.equal(found2.historique_statut_apprenant.length, 2);
      assert.equal(found2.historique_statut_apprenant[1].valeur_statut, updatePayload.statut_apprenant);
      assert.equal(
        found2.historique_statut_apprenant[1].date_statut.getTime(),
        updatePayload.date_metier_mise_a_jour_statut.getTime()
      );
      assert.equal(found2.statut_apprenant, updatePayload.statut_apprenant);
      assert.equal(isApproximatelyNow(found2.historique_statut_apprenant[1].date_reception), true);
    });

    it("Vérifie qu'on met à jour updated_at après un update", async () => {
      const { updateStatut, createStatutCandidat } = await statutsCandidats();

      const createdStatut = await createStatutCandidat(createRandomStatutCandidat());
      assert.equal(createdStatut.updated_at, null);

      // First update
      await updateStatut(createdStatut._id, { email_contact: "mail@example.com" });
      // Check value in db
      const foundAfterFirstUpdate = await StatutCandidatModel.findById(createdStatut._id);
      assert.notEqual(foundAfterFirstUpdate.email_contact, createdStatut.email_contact);
      assert.notEqual(foundAfterFirstUpdate.updated_at, null);

      // Second update
      await updateStatut(createdStatut._id, { periode_formation: [2030, 2033] });
      const foundAfterSecondUpdate = await StatutCandidatModel.findById(createdStatut._id);
      assert.notEqual(foundAfterSecondUpdate.periode_formation, createdStatut.periode_formation);
      assert.notEqual(foundAfterSecondUpdate.updated_at, foundAfterFirstUpdate.updated_at);
    });
  });

  describe("createStatutCandidat", () => {
    it("Vérifie la création d'un statut candidat randomisé", async () => {
      const { createStatutCandidat } = await statutsCandidats();

      const randomStatut = createRandomStatutCandidat();

      const createdStatut = await createStatutCandidat(randomStatut);
      const createdStatutJson = createdStatut.toJSON();

      assert.equal(createdStatutJson.ine_apprenant, randomStatut.ine_apprenant);
      assert.equal(createdStatutJson.nom_apprenant, randomStatut.nom_apprenant.toUpperCase());
      assert.equal(createdStatutJson.prenom_apprenant, randomStatut.prenom_apprenant.toUpperCase());
      assert.equal(createdStatutJson.ne_pas_solliciter, randomStatut.ne_pas_solliciter);
      assert.equal(createdStatutJson.email_contact, randomStatut.email_contact);
      assert.equal(createdStatutJson.formation_cfd, randomStatut.formation_cfd);
      assert.equal(createdStatutJson.libelle_court_formation, randomStatut.libelle_court_formation);
      assert.equal(createdStatutJson.libelle_long_formation, randomStatut.libelle_long_formation);
      assert.equal(createdStatutJson.uai_etablissement, randomStatut.uai_etablissement);
      assert.equal(createdStatutJson.siret_etablissement, randomStatut.siret_etablissement);
      assert.equal(createdStatutJson.nom_etablissement, randomStatut.nom_etablissement);
      assert.equal(createdStatutJson.statut_apprenant, randomStatut.statut_apprenant);
      assert.equal(createdStatutJson.source, randomStatut.source);
      assert.equal(createdStatutJson.annee_formation, randomStatut.annee_formation);
      assert.deepEqual(createdStatutJson.periode_formation, randomStatut.periode_formation);
      assert.deepEqual(createdStatutJson.annee_scolaire, randomStatut.annee_scolaire);
      assert.equal(createdStatutJson.historique_statut_apprenant.length, 1);
      assert.equal(createdStatutJson.historique_statut_apprenant[0].valeur_statut, randomStatut.statut_apprenant);
      assert.equal(
        createdStatutJson.historique_statut_apprenant[0].date_statut.getTime(),
        randomStatut.date_metier_mise_a_jour_statut.getTime()
      );
      assert.equal(isApproximatelyNow(createdStatutJson.historique_statut_apprenant[0].date_reception), true);
      assert.equal(createdStatutJson.updated_at, null);
    });

    it("Vérifie qu'à la création d'un statut avec un siret invalide on set le champ siret_etablissement_valid", async () => {
      const { createStatutCandidat } = await statutsCandidats();

      const statutWithInvalidSiret = { ...createRandomStatutCandidat(), siret_etablissement: "invalid-siret" };
      const createdStatut = await createStatutCandidat(statutWithInvalidSiret);

      assert.equal(createdStatut.siret_etablissement_valid, false);
    });

    it("Vérifie qu'à la création d'un statut avec un siret valid on set le champ siret_etablissement_valid", async () => {
      const { createStatutCandidat } = await statutsCandidats();

      const validSiret = "12312312300099";
      const statutWithValidSiret = { ...createRandomStatutCandidat(), siret_etablissement: validSiret };
      const createdStatut = await createStatutCandidat(statutWithValidSiret);

      assert.equal(createdStatut.siret_etablissement_valid, true);
    });

    it("Vérifie la création d'un statut avec un uai invalide", async () => {
      const { createStatutCandidat } = await statutsCandidats();

      const statutWithInvalidUai = { ...createRandomStatutCandidat(), uai_etablissement: "invalid-uai" };
      const createdStatut = await createStatutCandidat(statutWithInvalidUai);

      assert.equal(createdStatut.uai_etablissement_valid, false);
    });

    it("Vérifie la création d'un statut avec un uai valide", async () => {
      const { createStatutCandidat } = await statutsCandidats();

      const validUai = "0123456Z";
      const statutWithInvalidUai = { ...createRandomStatutCandidat(), uai_etablissement: validUai };
      const createdStatut = await createStatutCandidat(statutWithInvalidUai);

      assert.equal(createdStatut.uai_etablissement_valid, true);
    });

    it("Vérifie la création d'un statut avec un cfd invalide", async () => {
      const { createStatutCandidat } = await statutsCandidats();

      const invalidCfd = "0123";
      const statutWithInvalidUai = { ...createRandomStatutCandidat(), formation_cfd: invalidCfd };
      const createdStatut = await createStatutCandidat(statutWithInvalidUai);

      assert.equal(createdStatut.formation_cfd_valid, false);
    });

    it("Vérifie la création d'un statut avec un cfd valide", async () => {
      const { createStatutCandidat } = await statutsCandidats();

      const validCfd = "abcd1234";
      const statutWithInvalidUai = { ...createRandomStatutCandidat(), formation_cfd: validCfd };
      const createdStatut = await createStatutCandidat(statutWithInvalidUai);

      assert.equal(createdStatut.formation_cfd_valid, true);
    });

    it("Vérifie qu'à la création d'un statut avec un siret invalide on ne set pas le champ etablissement_reseaux", async () => {
      const { createStatutCandidat } = await statutsCandidats();
      const invalidSiret = "invalid";

      // Create sample cfa in referentiel
      const referenceCfa = new CfaModel({
        sirets: [invalidSiret],
        reseaux: [reseauxCfas.ANASUP.nomReseau, reseauxCfas.BTP_CFA.nomReseau],
      });
      await referenceCfa.save();

      // Create statut
      const statutWithInvalidSiret = { ...createRandomStatutCandidat(), siret_etablissement: invalidSiret };
      const createdStatut = await createStatutCandidat(statutWithInvalidSiret);

      // Check uai & reseaux in created statut
      const { siret_etablissement_valid, etablissement_reseaux } = createdStatut;
      assert.equal(siret_etablissement_valid, false);
      assert.equal(etablissement_reseaux.length, 0);
    });

    it("Vérifie qu'à la création d'un statut avec un uai valide on set le champ etablissement_reseaux et qu'on récupère le réseau depuis le referentiel CFA ", async () => {
      const { createStatutCandidat } = await statutsCandidats();
      const validUai = "0631450J";

      // Create sample cfa in referentiel
      const referenceCfa = new CfaModel({
        uai: validUai,
        reseaux: [reseauxCfas.ANASUP.nomReseau, reseauxCfas.BTP_CFA.nomReseau],
      });
      await referenceCfa.save();

      // Create statut
      const statutWithValidUai = { ...createRandomStatutCandidat(), uai_etablissement: validUai };
      const createdStatut = await createStatutCandidat(statutWithValidUai);

      // Check uai & reseaux in created statut
      const { uai_etablissement_valid, etablissement_reseaux } = createdStatut;
      assert.equal(uai_etablissement_valid, true);
      assert.equal(etablissement_reseaux.length, 2);
      assert.equal(etablissement_reseaux[0], reseauxCfas.ANASUP.nomReseau);
      assert.equal(etablissement_reseaux[1], reseauxCfas.BTP_CFA.nomReseau);
    });

    it("Vérifie qu'à la création d'un statut avec un uai invalide on ne set pas le champ etablissement_reseaux", async () => {
      const { createStatutCandidat } = await statutsCandidats();
      const invalidUai = "invalid";

      // Create sample cfa in referentiel
      const referenceCfa = new CfaModel({
        uai: invalidUai,
        reseaux: [reseauxCfas.ANASUP.nomReseau, reseauxCfas.BTP_CFA.nomReseau],
      });
      await referenceCfa.save();

      // Create statut
      const statutWithInvalidUai = { ...createRandomStatutCandidat(), uai_etablissement: invalidUai };
      const createdStatut = await createStatutCandidat(statutWithInvalidUai);

      // Check uai & reseaux in created statut
      const { uai_etablissement_valid, etablissement_reseaux } = createdStatut;
      assert.equal(uai_etablissement_valid, false);
      assert.equal(etablissement_reseaux.length, 0);
    });

    it("Vérifie qu'à la création d'un statut avec un CFD valide on crée la formation correspondante si elle n'existe pas", async () => {
      const { createStatutCandidat } = await statutsCandidats();

      // Create statut
      const cfd = "01022104";
      const statutWithValidCfd = { ...createRandomStatutCandidat(), formation_cfd: cfd };
      const createdStatut = await createStatutCandidat(statutWithValidCfd);

      assert.ok(createdStatut);
      // Check that formation was created
      const foundFormations = await FormationModel.find();
      assert.equal(foundFormations.length, 1);
      assert.equal(foundFormations[0].cfd, cfd);
    });

    it("Vérifie qu'à la création d'un statut avec un CFD valide on ne crée pas de formation si elle existe", async () => {
      const { createStatutCandidat } = await statutsCandidats();

      const cfd = "01022104";
      // Create formation
      const formation = await new FormationModel({ cfd }).save();

      // Create statut
      const statutWithValidCfd = { ...createRandomStatutCandidat(), formation_cfd: cfd };
      const createdStatut = await createStatutCandidat(statutWithValidCfd);

      assert.ok(createdStatut);
      // Check that new formation was not created
      const foundFormations = await FormationModel.find();
      assert.equal(foundFormations.length, 1);
      assert.equal(foundFormations[0].created_at.getTime(), formation.created_at.getTime());
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
        prenom_apprenant: "JEAN",
        nom_apprenant: "DUPONT",
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
        nom_apprenant: "WACHOSKY",
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
        prenom_apprenant: "JEA",
        nom_apprenant: "DUPONT",
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

    it("Vérifie la récupération des doublons d'uai", async () => {
      const { createStatutCandidat, getDuplicatesList } = await statutsCandidats();

      // Create 10 random statuts without duplicates
      for (let index = 0; index < 5; index++) {
        await createStatutCandidat(createRandomStatutCandidat());
      }

      // Create 4 statuts with same unicity group but different uai
      const commonData = {
        nom_apprenant: `KANTE`,
        prenom_apprenant: `NGOLO`,
        date_de_naissance_apprenant: new Date("2002-10-10T00:00:00.000+0000"),
        formation_cfd: "01022103",
        annee_scolaire: "2020-2021",
      };
      for (let index = 0; index < 4; index++) {
        await createStatutCandidat(
          createRandomStatutCandidat({ ...commonData, uai_etablissement: getRandomUaiEtablissement() })
        );
      }

      const duplicatesListFound = await getDuplicatesList(duplicatesTypesCodes.uai_etablissement.code);

      // 1 cas de doublons trouvé avec 4 doublons
      assert.equal(duplicatesListFound.length, 1);
      assert.equal(duplicatesListFound[0].duplicatesCount, 4);
      assert.equal(duplicatesListFound[0].duplicatesIds.length, 4);
    });
  });
});
