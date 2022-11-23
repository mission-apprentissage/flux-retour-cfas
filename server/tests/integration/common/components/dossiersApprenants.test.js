import { strict as assert } from "assert";

// eslint-disable-next-line node/no-unpublished-require
import MockDate from "mockdate";

import { addDays, isEqual } from "date-fns";
import dossiersApprenants from "../../../../src/common/components/dossiersApprenants.js";
import { createRandomDossierApprenant, getRandomUaiEtablissement } from "../../../data/randomizedSample.js";
import {
  CODES_STATUT_APPRENANT,
  DUPLICATE_TYPE_CODES,
} from "../../../../src/common/constants/dossierApprenantConstants.js";
import { RESEAUX_CFAS } from "../../../../src/common/constants/networksConstants.js";
import { cfasDb, dossiersApprenantsDb } from "../../../../src/common/model/collections.js";
import { getDuplicatesList } from "../../../../src/jobs/support/dossiersApprenants.duplicates.actions.js";

describe("Components Dossiers Apprenants Test", () => {
  let fakeNowDate;
  beforeEach(() => {
    fakeNowDate = new Date();
    MockDate.set(fakeNowDate);
  });

  afterEach(() => {
    MockDate.reset();
  });

  describe("getDossierApprenant", () => {
    it("Vérifie la récupération d'un statut sur les champs d'unicité : nom, prenom, date_de_naissance, formation_cfd, uai_etablissement et annee_scolaire", async () => {
      const { getDossierApprenant, createDossierApprenant } = await dossiersApprenants();

      const randomStatutProps = createRandomDossierApprenant();
      const createdStatut = await createDossierApprenant(randomStatutProps);

      const found = await getDossierApprenant({
        nom_apprenant: randomStatutProps.nom_apprenant,
        prenom_apprenant: randomStatutProps.prenom_apprenant,
        date_de_naissance_apprenant: randomStatutProps.date_de_naissance_apprenant,
        formation_cfd: randomStatutProps.formation_cfd,
        uai_etablissement: randomStatutProps.uai_etablissement,
        annee_scolaire: randomStatutProps.annee_scolaire,
      });

      assert.equal(found._id.equals(createdStatut._id.toString()), true);
    });

    it("Vérifie que la récupération d'un statut est insensible à la casse de nom_apprenant", async () => {
      const { getDossierApprenant, createDossierApprenant } = await dossiersApprenants();

      const randomStatutProps = createRandomDossierApprenant({
        nom_apprenant: "SMITH",
      });
      const createdStatut = await createDossierApprenant(randomStatutProps);

      const found = await getDossierApprenant({
        nom_apprenant: "Smith",
        prenom_apprenant: randomStatutProps.prenom_apprenant,
        date_de_naissance_apprenant: randomStatutProps.date_de_naissance_apprenant,
        formation_cfd: randomStatutProps.formation_cfd,
        uai_etablissement: randomStatutProps.uai_etablissement,
        annee_scolaire: randomStatutProps.annee_scolaire,
      });

      assert.equal(found._id.equals(createdStatut._id.toString()), true);
    });

    it("Vérifie que la récupération d'un statut fonctionne avec des caractères spéciaux", async () => {
      const { getDossierApprenant, createDossierApprenant } = await dossiersApprenants();

      const randomStatutProps = createRandomDossierApprenant({
        nom_apprenant: "ABDILLAH (R)",
        prenom_apprenant: "*Paul",
      });
      const createdStatut = await createDossierApprenant(randomStatutProps);

      const found = await getDossierApprenant({
        nom_apprenant: "ABDILLAH (R)",
        prenom_apprenant: "*Paul",
        date_de_naissance_apprenant: randomStatutProps.date_de_naissance_apprenant,
        formation_cfd: randomStatutProps.formation_cfd,
        uai_etablissement: randomStatutProps.uai_etablissement,
        annee_scolaire: randomStatutProps.annee_scolaire,
      });

      assert.equal(found._id.equals(createdStatut._id.toString()), true);
    });

    it("Vérifie que la récupération d'un statut est insensible à la casse de prenom_apprenant", async () => {
      const { getDossierApprenant, createDossierApprenant } = await dossiersApprenants();

      const randomStatutProps = createRandomDossierApprenant({
        prenom_apprenant: "John Abdoul-Bæstoï*",
      });
      const createdStatut = await createDossierApprenant(randomStatutProps);

      const found = await getDossierApprenant({
        nom_apprenant: randomStatutProps.nom_apprenant,
        prenom_apprenant: "jOhN AbDoUl-BÆSTOÏ*",
        date_de_naissance_apprenant: randomStatutProps.date_de_naissance_apprenant,
        formation_cfd: randomStatutProps.formation_cfd,
        uai_etablissement: randomStatutProps.uai_etablissement,
        annee_scolaire: randomStatutProps.annee_scolaire,
      });

      assert.equal(found._id.equals(createdStatut._id.toString()), true);
    });

    it("Vérifie que la récupération d'un statut ne match pas sur les substring du prenom et nom de l'apprenant", async () => {
      const { getDossierApprenant, createDossierApprenant } = await dossiersApprenants();

      const randomStatutProps = createRandomDossierApprenant({
        prenom_apprenant: "Jeanne",
        nom_apprenant: "Martinez",
      });

      await createDossierApprenant(randomStatutProps);

      const found = await getDossierApprenant({
        prenom_apprenant: "Jean",
        nom_apprenant: "Martin",
        formation_cfd: randomStatutProps.formation_cfd,
        uai_etablissement: randomStatutProps.uai_etablissement,
        annee_scolaire: randomStatutProps.annee_scolaire,
        date_de_naissance_apprenant: randomStatutProps.date_de_naissance_apprenant,
      });

      assert.equal(found, null);
    });

    it("Vérifie que la récupération d'un dossier apprenant match quand prenom et nom de l'apprenant contiennent des espaces", async () => {
      const { getDossierApprenant, createDossierApprenant } = await dossiersApprenants();

      const randomStatutProps = createRandomDossierApprenant({
        prenom_apprenant: "Jeanne",
        nom_apprenant: "Martinez",
      });

      const createdStatut = await createDossierApprenant(randomStatutProps);

      const found = await getDossierApprenant({
        prenom_apprenant: "  Jeanne",
        nom_apprenant: "Martinez ",
        formation_cfd: randomStatutProps.formation_cfd,
        uai_etablissement: randomStatutProps.uai_etablissement,
        annee_scolaire: randomStatutProps.annee_scolaire,
        date_de_naissance_apprenant: randomStatutProps.date_de_naissance_apprenant,
      });

      assert.notEqual(found, null);
      assert.equal(found._id.equals(createdStatut._id.toString()), true);
    });

    const unicityCriterion = [
      { field: "nom_apprenant", changedValue: "changed" },
      { field: "prenom_apprenant", changedValue: "changed" },
      { field: "date_de_naissance_apprenant", changedValue: new Date("2020-01-10") },
      { field: "uai_etablissement", changedValue: "changed" },
      { field: "formation_cfd", changedValue: "changed" },
      { field: "annee_scolaire", changedValue: "changed" },
    ];

    unicityCriterion.forEach((unicityCriteria) => {
      it(`Vérifie qu'on ne trouve pas le statut créé quand ${unicityCriteria.field} a changé`, async () => {
        const { getDossierApprenant, createDossierApprenant } = await dossiersApprenants();

        const randomStatutProps = createRandomDossierApprenant();
        await createDossierApprenant(randomStatutProps);

        const found = await getDossierApprenant({
          nom_apprenant: randomStatutProps.nom_apprenant,
          prenom_apprenant: randomStatutProps.prenom_apprenant,
          date_de_naissance_apprenant: randomStatutProps.date_de_naissance_apprenant,
          formation_cfd: randomStatutProps.formation_cfd,
          uai_etablissement: randomStatutProps.uai_etablissement,
          annee_scolaire: randomStatutProps.annee_scolaire,
          [unicityCriteria.field]: unicityCriteria.changedValue,
        });
        assert.equal(found, null);
      });
    });
  });

  describe("addOrUpdateDossiersApprenants", () => {
    it("Vérifie l'ajout ou la mise à jour d'un statut'", async () => {
      const { addOrUpdateDossiersApprenants } = await dossiersApprenants();

      const seed1 = [
        createRandomDossierApprenant({
          nom_apprenant: "MBAPPE",
          prenom_apprenant: "Kylian",
          statut_apprenant: CODES_STATUT_APPRENANT.abandon,
        }),
        createRandomDossierApprenant({
          nom_apprenant: "ALONSO",
          prenom_apprenant: "Marcos",
          statut_apprenant: CODES_STATUT_APPRENANT.apprenti,
        }),
        createRandomDossierApprenant({
          nom_apprenant: "HAVERTZ",
          prenom_apprenant: "Kai",
          statut_apprenant: CODES_STATUT_APPRENANT.inscrit,
        }),
      ];

      // Add statuts test
      await addOrUpdateDossiersApprenants(seed1);
      assert.equal(await dossiersApprenantsDb().countDocuments(), 3);

      const seed2 = [
        seed1[0],
        { ...seed1[1], statut_apprenant: CODES_STATUT_APPRENANT.abandon, date_metier_mise_a_jour_statut: new Date() },
        { ...seed1[2], email_contact: "updated@mail.com" },
        { ...seed1[2], nom_apprenant: "WERNER", prenom_apprenant: "Timo" },
      ];
      const { added, updated } = await addOrUpdateDossiersApprenants(seed2);

      // Check added
      assert.equal(added.length, 1);
      const foundAdded = await dossiersApprenantsDb().findOne({ _id: added[0]._id });
      assert.equal(foundAdded.nom_apprenant.toUpperCase(), seed2[3].nom_apprenant.toUpperCase());
      assert.equal(foundAdded.prenom_apprenant.toUpperCase(), seed2[3].prenom_apprenant.toUpperCase());
      assert.equal(foundAdded.email_contact, seed2[3].email_contact);
      assert.equal(foundAdded.formation_cfd, seed2[3].formation_cfd);
      assert.equal(foundAdded.uai_etablissement, seed2[3].uai_etablissement);
      assert.equal(foundAdded.historique_statut_apprenant[0].valeur_statut, seed2[3].statut_apprenant);
      assert.equal(
        foundAdded.historique_statut_apprenant[0].date_statut.getTime(),
        seed2[3].date_metier_mise_a_jour_statut.getTime()
      );
      assert.equal(foundAdded.annee_scolaire, seed2[3].annee_scolaire);
      assert.equal(foundAdded.updated_at, null);

      // Check updated
      assert.equal(updated.length, 3);

      const firstUpdated = await dossiersApprenantsDb().findOne({ _id: updated[0]._id });
      assert.equal(firstUpdated.nom_apprenant.toUpperCase(), seed1[0].nom_apprenant.toUpperCase());
      assert.equal(firstUpdated.prenom_apprenant.toUpperCase(), seed1[0].prenom_apprenant.toUpperCase());
      assert.equal(firstUpdated.uai_etablissement, seed1[0].uai_etablissement);
      assert.equal(firstUpdated.formation_cfd, seed1[0].formation_cfd);
      assert.equal(firstUpdated.annee_scolaire, seed1[0].annee_scolaire);
      assert.equal(firstUpdated.historique_statut_apprenant.length, 1);
      assert.equal(firstUpdated.historique_statut_apprenant[0].valeur_statut, seed1[0].statut_apprenant);
      assert.equal(
        firstUpdated.historique_statut_apprenant[0].date_statut.getTime(),
        seed1[0].date_metier_mise_a_jour_statut.getTime()
      );
      assert.equal(firstUpdated.updated_at.getTime(), fakeNowDate.getTime());

      const secondUpdated = await dossiersApprenantsDb().findOne({ _id: updated[1]._id });
      assert.equal(secondUpdated.nom_apprenant.toUpperCase(), seed1[1].nom_apprenant.toUpperCase());
      assert.equal(secondUpdated.prenom_apprenant.toUpperCase(), seed1[1].prenom_apprenant.toUpperCase());
      assert.equal(secondUpdated.uai_etablissement, seed1[1].uai_etablissement);
      assert.equal(secondUpdated.formation_cfd, seed1[1].formation_cfd);
      assert.equal(secondUpdated.annee_scolaire, seed1[1].annee_scolaire);
      assert.equal(secondUpdated.historique_statut_apprenant.length, 2);
      assert.equal(secondUpdated.historique_statut_apprenant[1].valeur_statut, seed2[1].statut_apprenant);
      assert.equal(
        secondUpdated.historique_statut_apprenant[1].date_statut.getTime(),
        seed2[1].date_metier_mise_a_jour_statut.getTime()
      );
      assert.equal(secondUpdated.updated_at.getTime(), fakeNowDate.getTime());

      const thirdUpdated = await dossiersApprenantsDb().findOne({ _id: updated[2]._id });
      assert.equal(thirdUpdated.nom_apprenant.toUpperCase(), seed1[2].nom_apprenant.toUpperCase());
      assert.equal(thirdUpdated.prenom_apprenant.toUpperCase(), seed1[2].prenom_apprenant.toUpperCase());
      assert.equal(thirdUpdated.uai_etablissement, seed1[2].uai_etablissement);
      assert.equal(thirdUpdated.formation_cfd, seed1[2].formation_cfd);
      assert.equal(thirdUpdated.annee_scolaire, seed1[2].annee_scolaire);
      assert.equal(thirdUpdated.historique_statut_apprenant.length, 1);
      assert.equal(thirdUpdated.historique_statut_apprenant[0].valeur_statut, seed1[2].statut_apprenant);
      assert.equal(
        thirdUpdated.historique_statut_apprenant[0].date_statut.getTime(),
        seed1[2].date_metier_mise_a_jour_statut.getTime()
      );
      assert.equal(thirdUpdated.updated_at.getTime(), fakeNowDate.getTime());
    });

    it("Vérifie qu'on peut créer un statut avec une période formation sur une même année", async () => {
      const { addOrUpdateDossiersApprenants } = await dossiersApprenants();
      const samplePeriodSameYear = [2021, 2021];

      const statutWithPeriodeFormationOnSameYear = {
        ...createRandomDossierApprenant(),
        periode_formation: samplePeriodSameYear,
      };

      const result = await addOrUpdateDossiersApprenants([statutWithPeriodeFormationOnSameYear]);
      assert.equal(result.added.length, 1);
      assert.equal(result.updated.length, 0);
      assert.equal(await dossiersApprenantsDb().countDocuments(), 1);
    });

    it("Vérifie qu'on update le siret_etablissement d'un statut existant qui n'en a pas avec le SIRET de l'élément passé si le reste des infos est identique", async () => {
      const { addOrUpdateDossiersApprenants } = await dossiersApprenants();

      const statutWithoutSiret = { ...createRandomDossierApprenant(), siret_etablissement: null };
      const result = await addOrUpdateDossiersApprenants([statutWithoutSiret]);
      assert.equal(result.added.length, 1);
      assert.equal(result.updated.length, 0);

      // send the same statut but with a siret
      const sameStatutWithSiret = { ...statutWithoutSiret, siret_etablissement: "12312312300099" };
      const { added, updated } = await addOrUpdateDossiersApprenants([sameStatutWithSiret]);

      // statut should have been updated
      assert.equal(added.length, 0, "added problem");
      assert.equal(updated.length, 1);
      const count = await dossiersApprenantsDb().countDocuments();
      assert.equal(count, 1);

      // check in db
      const found = await dossiersApprenantsDb().findOne({ _id: result.added[0]._id });
      assert.equal(found.siret_etablissement, "12312312300099");
      assert.notEqual(found.updated_at, null);
    });

    it("Vérifie qu'un changement sur le champ periode_formation d'un statut existant est considéré comme un update", async () => {
      const { addOrUpdateDossiersApprenants } = await dossiersApprenants();

      const statutWithoutPeriodeFormation = createRandomDossierApprenant({ periode_formation: null });
      const result = await addOrUpdateDossiersApprenants([statutWithoutPeriodeFormation]);
      assert.equal(result.added.length, 1);
      assert.equal(result.updated.length, 0);

      // send the same statut but with a different periode_formation
      const sameStatutWithPeriodeFormation = { ...statutWithoutPeriodeFormation, periode_formation: [2021, 2022] };
      const { added, updated } = await addOrUpdateDossiersApprenants([sameStatutWithPeriodeFormation]);

      // statut should have been updated
      assert.equal(added.length, 0);
      assert.equal(updated.length, 1);
      const count = await dossiersApprenantsDb().countDocuments();
      assert.equal(count, 1);

      // check in db
      const found = await dossiersApprenantsDb().findOne({ _id: result.added[0]._id });
      assert.deepEqual(found.periode_formation, [2021, 2022]);
      assert.notEqual(found.updated_at, null);
    });

    it("Vérifie qu'un changement sur le champ annee_formation d'un statut existant est considéré comme un update", async () => {
      const { addOrUpdateDossiersApprenants } = await dossiersApprenants();

      const statutWithoutAnneeFormation = createRandomDossierApprenant({ annee_formation: null });
      const result = await addOrUpdateDossiersApprenants([statutWithoutAnneeFormation]);
      assert.equal(result.added.length, 1);
      assert.equal(result.updated.length, 0);

      // send the same statut but with a different annee_formation
      const sameStatutWithAnneeFormation = { ...statutWithoutAnneeFormation, annee_formation: 2020 };
      const { added, updated } = await addOrUpdateDossiersApprenants([sameStatutWithAnneeFormation]);

      // statut should have been updated
      assert.equal(added.length, 0);
      assert.equal(updated.length, 1);
      const count = await dossiersApprenantsDb().countDocuments();
      assert.equal(count, 1);

      // check in db
      const found = await dossiersApprenantsDb().findOne({ _id: result.added[0]._id });
      assert.equal(found.annee_formation, 2020);
      assert.notEqual(found.updated_at, null);
    });

    it("Vérifie que nom_apprenant est un critère d'unicité (on crée un nouveau dossierApprenant quand un ajoute un autre statut identique mais avec un nom_apprenant différent)", async () => {
      const { addOrUpdateDossiersApprenants } = await dossiersApprenants();

      const sampleNom = "SMITH";
      const sampleNom2 = "JONES";
      const samplePrenom = "John";
      const validCfd = "abcd1234";
      const validUai = "0123456Z";

      // Create 2 distinct items
      const uniqueStatutToCreate = {
        ...createRandomDossierApprenant(),
        nom_apprenant: sampleNom,
        prenom_apprenant: samplePrenom,
        formation_cfd: validCfd,
        uai_etablissement: validUai,
      };
      const firstCallResult = await addOrUpdateDossiersApprenants([uniqueStatutToCreate]);
      assert.equal(firstCallResult.added.length, 1);
      assert.equal(firstCallResult.updated.length, 0);

      // send the same statut information but with a different nom
      const sameStatutInformationWithDifferentNom = { ...uniqueStatutToCreate, nom_apprenant: sampleNom2 };
      const secondCallResult = await addOrUpdateDossiersApprenants([sameStatutInformationWithDifferentNom]);

      // a new statut should have been created
      assert.equal(secondCallResult.added.length, 1);
      assert.equal(secondCallResult.updated.length, 0);
      const count = await dossiersApprenantsDb().countDocuments();
      assert.equal(count, 2);

      // check in db
      const found = await dossiersApprenantsDb().findOne({ _id: firstCallResult.added[0]._id });
      assert.equal(found.nom_apprenant, sampleNom);
      assert.equal(found.updated_at, null);
    });

    it("Vérifie que prenom_apprenant est un critère d'unicité (on crée un nouveau dossierApprenant quand un ajoute un autre statut identique mais avec un prenom_apprenant différent)", async () => {
      const { addOrUpdateDossiersApprenants } = await dossiersApprenants();

      const sampleNom = "SMITH";
      const samplePrenom = "John";
      const samplePrenom2 = "Jack";
      const validCfd = "abcd1234";
      const validUai = "0123456Z";

      // Create 2 distinct items
      const uniqueStatutToCreate = {
        ...createRandomDossierApprenant(),
        nom_apprenant: sampleNom,
        prenom_apprenant: samplePrenom,
        formation_cfd: validCfd,
        uai_etablissement: validUai,
      };
      const firstCallResult = await addOrUpdateDossiersApprenants([uniqueStatutToCreate]);
      assert.equal(firstCallResult.added.length, 1);
      assert.equal(firstCallResult.updated.length, 0);

      // send the same statut but with a different prenom
      const sameStatutWithDifferentPrenom = { ...uniqueStatutToCreate, prenom_apprenant: samplePrenom2 };
      const secondCallResult = await addOrUpdateDossiersApprenants([sameStatutWithDifferentPrenom]);

      // a new statut should have been created
      assert.equal(secondCallResult.added.length, 1);
      assert.equal(secondCallResult.updated.length, 0);
      const count = await dossiersApprenantsDb().countDocuments();
      assert.equal(count, 2);

      // check in db
      const found = await dossiersApprenantsDb().findOne({ _id: firstCallResult.added[0]._id });
      assert.equal(found.prenom_apprenant, samplePrenom.toUpperCase());
      assert.equal(found.updated_at, null);
    });

    it("Vérifie que date_de_naissance_apprenant est un critère d'unicité (on crée un nouveau dossierApprenant quand un ajoute un autre statut identique mais avec une date_de_naissance_apprenant différente)", async () => {
      const { addOrUpdateDossiersApprenants } = await dossiersApprenants();

      const sampleNom = "GRIEZMANN";
      const samplePrenom = "Antoine";
      const sampleDateDeNaissance = new Date("1990-09-20T00:00:00.000+0000");
      const sampleDateDeNaissance2 = new Date("1990-10-20T00:00:00.000+0000");
      const validCfd = "abcd1234";
      const validUai = "0123456Z";

      // Create 2 distinct items
      const uniqueStatutToCreate = {
        ...createRandomDossierApprenant(),
        nom_apprenant: sampleNom,
        prenom_apprenant: samplePrenom,
        date_de_naissance_apprenant: sampleDateDeNaissance,
        formation_cfd: validCfd,
        uai_etablissement: validUai,
      };
      const firstCallResult = await addOrUpdateDossiersApprenants([uniqueStatutToCreate]);
      assert.equal(firstCallResult.added.length, 1);
      assert.equal(firstCallResult.updated.length, 0);

      // send the same statut but with a different date_de_naissance
      const sameStatutWithDifferentPrenom = {
        ...uniqueStatutToCreate,
        date_de_naissance_apprenant: sampleDateDeNaissance2,
      };
      const secondCallResult = await addOrUpdateDossiersApprenants([sameStatutWithDifferentPrenom]);

      // a new statut should have been created
      assert.equal(secondCallResult.added.length, 1);
      assert.equal(secondCallResult.updated.length, 0);
      const count = await dossiersApprenantsDb().countDocuments();
      assert.equal(count, 2);

      // check in db
      const found = await dossiersApprenantsDb().findOne({ _id: firstCallResult.added[0]._id });
      assert.equal(found.date_de_naissance_apprenant.getTime(), sampleDateDeNaissance.getTime());
      assert.equal(found.updated_at, null);
    });

    it("Vérifie que formation_cfd est un critère d'unicité (on crée un nouveau dossierApprenant quand un ajoute un autre statut identique mais avec un formation_cfd différent)", async () => {
      const { addOrUpdateDossiersApprenants } = await dossiersApprenants();

      const sampleNom = "SMITH";
      const samplePrenom = "John";
      const validCfd = "abcd1234";
      const validCfd2 = "abcd9999";
      const validUai = "0123456Z";

      // Create 2 distinct items
      const uniqueStatutToCreate = {
        ...createRandomDossierApprenant(),
        nom_apprenant: sampleNom,
        prenom_apprenant: samplePrenom,
        formation_cfd: validCfd,
        uai_etablissement: validUai,
      };
      const firstCallResult = await addOrUpdateDossiersApprenants([uniqueStatutToCreate]);
      assert.equal(firstCallResult.added.length, 1);
      assert.equal(firstCallResult.updated.length, 0);

      // send the same statut but with a different cfd
      const sameStatutWithDifferentCfd = { ...uniqueStatutToCreate, formation_cfd: validCfd2 };
      const secondCallResult = await addOrUpdateDossiersApprenants([sameStatutWithDifferentCfd]);

      // a new statut should have been created
      assert.equal(secondCallResult.added.length, 1);
      assert.equal(secondCallResult.updated.length, 0);
      const count = await dossiersApprenantsDb().countDocuments();
      assert.equal(count, 2);

      // check in db
      const found = await dossiersApprenantsDb().findOne({ _id: firstCallResult.added[0]._id });
      assert.equal(found.formation_cfd, validCfd);
      assert.equal(found.updated_at, null);
    });

    it("Vérifie que annee_scolaire est un critère d'unicité (on crée un nouveau dossierApprenant quand un ajoute un autre statut identique mais avec un annee_scolaire différent)", async () => {
      const { addOrUpdateDossiersApprenants } = await dossiersApprenants();

      const sampleNom = "SMITH";
      const samplePrenom = "John";
      const validCfd = "abcd1234";
      const validUai = "0123456Z";
      const anneeScolaire = "2020-2021";

      // Create 2 distinct items
      const uniqueStatutToCreate = {
        ...createRandomDossierApprenant(),
        nom_apprenant: sampleNom,
        prenom_apprenant: samplePrenom,
        formation_cfd: validCfd,
        uai_etablissement: validUai,
        annee_scolaire: anneeScolaire,
      };
      const firstCallResult = await addOrUpdateDossiersApprenants([uniqueStatutToCreate]);
      assert.equal(firstCallResult.added.length, 1);
      assert.equal(firstCallResult.updated.length, 0);

      // send the same statut information but with a different annee_scolaire
      const sameStatutWithDifferentUai = { ...uniqueStatutToCreate, annee_scolaire: "2021-2022" };
      const secondCallResult = await addOrUpdateDossiersApprenants([sameStatutWithDifferentUai]);

      // a new statut should have been created
      assert.equal(secondCallResult.added.length, 1);
      assert.equal(secondCallResult.updated.length, 0);
      const count = await dossiersApprenantsDb().countDocuments();
      assert.equal(count, 2);

      // check in db that first created element was not updated
      const found = await dossiersApprenantsDb().findOne({ _id: firstCallResult.added[0]._id });
      assert.equal(found.annee_scolaire, anneeScolaire);
      assert.equal(found.updated_at, null);
    });

    it("Vérifie que uai_etablissement est un critère d'unicité (on crée un nouveau dossierApprenant quand un ajoute un autre statut identique mais avec un uai_etablissement différent)", async () => {
      const { addOrUpdateDossiersApprenants } = await dossiersApprenants();

      const sampleNom = "SMITH";
      const samplePrenom = "John";
      const validCfd = "abcd1234";
      const validUai = "0123456Z";
      const validUai2 = "1111111Z";

      // Create 2 distinct items
      const uniqueStatutToCreate = {
        ...createRandomDossierApprenant(),
        nom_apprenant: sampleNom,
        prenom_apprenant: samplePrenom,
        formation_cfd: validCfd,
        uai_etablissement: validUai,
      };
      const firstCallResult = await addOrUpdateDossiersApprenants([uniqueStatutToCreate]);
      assert.equal(firstCallResult.added.length, 1);
      assert.equal(firstCallResult.updated.length, 0);

      // send the same statut information but with a different uai
      const sameStatutWithDifferentUai = { ...uniqueStatutToCreate, uai_etablissement: validUai2 };
      const secondCallResult = await addOrUpdateDossiersApprenants([sameStatutWithDifferentUai]);

      // a new statut should have been created
      assert.equal(secondCallResult.added.length, 1);
      assert.equal(secondCallResult.updated.length, 0);
      const count = await dossiersApprenantsDb().countDocuments();
      assert.equal(count, 2);

      // check in db
      const found = await dossiersApprenantsDb().findOne({ _id: firstCallResult.added[0]._id });
      assert.equal(found.uai_etablissement, validUai);
      assert.equal(found.updated_at, null);
    });

    it("Vérifie qu'on ne crée pas mais MAJ un dossierApprenant quand un ajoute un autre statut identique mais avec une période différente", async () => {
      const { addOrUpdateDossiersApprenants } = await dossiersApprenants();

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
      const uniqueStatutToCreate = createRandomDossierApprenant(input);
      const firstCallResult = await addOrUpdateDossiersApprenants([uniqueStatutToCreate]);
      assert.equal(firstCallResult.added.length, 1);
      assert.equal(firstCallResult.updated.length, 0);

      // send the same statut but with a different periode_formation
      const sameStatutWithDifferentPeriode = { ...uniqueStatutToCreate, periode_formation: samplePeriode2 };
      const secondCallResult = await addOrUpdateDossiersApprenants([sameStatutWithDifferentPeriode]);

      // no new statut should have been created
      assert.equal(secondCallResult.added.length, 0);
      assert.equal(secondCallResult.updated.length, 1);
      const count = await dossiersApprenantsDb().countDocuments();
      assert.equal(count, 1);

      // check in db
      const found = await dossiersApprenantsDb().findOne({ _id: firstCallResult.added[0]._id });
      assert.deepEqual(found.periode_formation.join(), samplePeriode2.join());
      assert.notEqual(found.updated_at, null);
    });

    it("Vérifie qu'on ne crée pas mais MAJ un dossierApprenant quand un ajoute un autre statut identique mais avec une année différente", async () => {
      const { addOrUpdateDossiersApprenants } = await dossiersApprenants();

      const sampleNom = "SMITH";
      const samplePrenom = "John";
      const validCfd = "abcd1234";
      const validUai = "0123456Z";
      const sampleAnnee = 2019;
      const sampleAnnee2 = 2021;

      // Create 2 distinct items
      const uniqueStatutToCreate = {
        ...createRandomDossierApprenant(),
        nom_apprenant: sampleNom,
        prenom_apprenant: samplePrenom,
        formation_cfd: validCfd,
        uai_etablissement: validUai,
        annee_formation: sampleAnnee,
      };
      const firstCallResult = await addOrUpdateDossiersApprenants([uniqueStatutToCreate]);
      assert.equal(firstCallResult.added.length, 1);
      assert.equal(firstCallResult.updated.length, 0);

      // send the same statut but with a different annee_formation
      const sameStatutWithDifferentAnnee = { ...uniqueStatutToCreate, annee_formation: sampleAnnee2 };
      const secondCallResult = await addOrUpdateDossiersApprenants([sameStatutWithDifferentAnnee]);

      // no new statut should have been created
      assert.equal(secondCallResult.added.length, 0);
      assert.equal(secondCallResult.updated.length, 1);
      const count = await dossiersApprenantsDb().countDocuments();
      assert.equal(count, 1);

      // check in db
      const found = await dossiersApprenantsDb().findOne({ _id: firstCallResult.added[0]._id });
      assert.equal(found.annee_formation, sampleAnnee2);
      assert.notEqual(found.updated_at, null);
    });

    it("Vérifie qu'on ne crée pas mais MAJ un dossierApprenant quand un ajoute un autre statut identique mais avec un siret_etablissement différent", async () => {
      const { addOrUpdateDossiersApprenants } = await dossiersApprenants();

      const sampleNom = "SMITH";
      const samplePrenom = "John";
      const validCfd = "abcd1234";
      const validUai = "0123456Z";
      const siret_etablissement = "80460782800088";
      const siret_etablissement2 = "12345678901234";

      // Create 2 distinct items
      const uniqueStatutToCreate = {
        ...createRandomDossierApprenant(),
        nom_apprenant: sampleNom,
        prenom_apprenant: samplePrenom,
        formation_cfd: validCfd,
        uai_etablissement: validUai,
        siret_etablissement,
      };
      const firstCallResult = await addOrUpdateDossiersApprenants([uniqueStatutToCreate]);
      assert.equal(firstCallResult.added.length, 1);
      assert.equal(firstCallResult.updated.length, 0);

      // send the same statut but with a different siret_etablissement
      const sameStatutWithDifferentAnnee = { ...uniqueStatutToCreate, siret_etablissement: siret_etablissement2 };
      const secondCallResult = await addOrUpdateDossiersApprenants([sameStatutWithDifferentAnnee]);

      // no new statut should have been created
      assert.equal(secondCallResult.added.length, 0);
      assert.equal(secondCallResult.updated.length, 1);
      const count = await dossiersApprenantsDb().countDocuments();
      assert.equal(count, 1);

      const found = await dossiersApprenantsDb().findOne({ _id: firstCallResult.added[0]._id });
      assert.equal(found.siret_etablissement, siret_etablissement2);
    });

    it("Vérifie qu'on ne crée pas mais MAJ un dossierApprenant quand un ajoute un autre statut identique mais avec une différence sur les prénoms 2-3 / email", async () => {
      const { addOrUpdateDossiersApprenants } = await dossiersApprenants();

      const sampleNom = "SMITH";
      const samplePrenom = "John";
      const sampleEmail = "john@email.fr";
      const validCfd = "abcd1234";
      const validUai = "0123456Z";

      const updatedEmail = "other@email.fr";

      // Create 2 distinct items
      const uniqueStatutToCreate = {
        ...createRandomDossierApprenant(),
        nom_apprenant: sampleNom,
        prenom_apprenant: samplePrenom,
        formation_cfd: validCfd,
        uai_etablissement: validUai,
        email_contact: sampleEmail,
      };
      const firstCallResult = await addOrUpdateDossiersApprenants([uniqueStatutToCreate]);
      assert.equal(firstCallResult.added.length, 1);
      assert.equal(firstCallResult.updated.length, 0);

      // send the same statut but with updates on prenom2-3 & email
      const sameStatutWithUpdatesPrenomEmail = {
        ...uniqueStatutToCreate,
        email_contact: updatedEmail,
      };
      const secondCallResult = await addOrUpdateDossiersApprenants([sameStatutWithUpdatesPrenomEmail]);

      // no new statut should have been created but update only
      assert.equal(secondCallResult.added.length, 0);
      assert.equal(secondCallResult.updated.length, 1);
      const count = await dossiersApprenantsDb().countDocuments();
      assert.equal(count, 1);

      // check in db
      const found = await dossiersApprenantsDb().findOne({ _id: firstCallResult.added[0]._id });
      assert.equal(found.email_contact, updatedEmail);
      assert.notEqual(found.updated_at, null);
    });
  });

  describe("updateDossierApprenant", () => {
    it("Vérifie qu'on ne peut pas update le champ prenom_apprenant", async () => {
      const { updateDossierApprenant, createDossierApprenant } = await dossiersApprenants();

      const createdStatut = await createDossierApprenant(
        createRandomDossierApprenant({
          prenom_apprenant: "John",
        })
      );
      assert.equal(createdStatut.updated_at, null);

      // First update
      await updateDossierApprenant(createdStatut._id, { prenom_apprenant: "André-Pierre" });
      // Check value in db
      const foundAfterUpdate = await dossiersApprenantsDb().findOne({ _id: createdStatut._id });
      assert.equal(foundAfterUpdate.prenom_apprenant, createdStatut.prenom_apprenant);
    });

    it("Vérifie qu'on ne peut pas update le champ nom_apprenant", async () => {
      const { updateDossierApprenant, createDossierApprenant } = await dossiersApprenants();

      const createdStatut = await createDossierApprenant(
        createRandomDossierApprenant({
          nom_apprenant: "Macron",
        })
      );
      assert.equal(createdStatut.updated_at, null);

      // First update
      await updateDossierApprenant(createdStatut._id, { nom_apprenant: "Philippe" });
      // Check value in db
      const foundAfterUpdate = await dossiersApprenantsDb().findOne({ _id: createdStatut._id });
      assert.equal(foundAfterUpdate.nom_apprenant, createdStatut.nom_apprenant);
    });

    it("Vérifie qu'on ne peut pas update le champ date_de_naissance_apprenant", async () => {
      const { updateDossierApprenant, createDossierApprenant } = await dossiersApprenants();

      const createdStatut = await createDossierApprenant(
        createRandomDossierApprenant({
          date_de_naissance_apprenant: new Date("1990-09-20T00:00:00.000+0000"),
        })
      );
      assert.equal(createdStatut.updated_at, null);

      // First update
      await updateDossierApprenant(createdStatut._id, {
        date_de_naissance_apprenant: new Date("1990-12-20T00:00:00.000+0000"),
      });
      // Check value in db
      const foundAfterUpdate = await dossiersApprenantsDb().findOne({ _id: createdStatut._id });
      assert.equal(foundAfterUpdate.nom_apprenant, createdStatut.nom_apprenant);
    });

    it("Vérifie qu'on ne peut pas update le champ annee_scolaire", async () => {
      const { updateDossierApprenant, createDossierApprenant } = await dossiersApprenants();

      const createdStatut = await createDossierApprenant(
        createRandomDossierApprenant({
          annee_scolaire: "2021-2022",
        })
      );
      assert.equal(createdStatut.updated_at, null);

      // First update
      await updateDossierApprenant(createdStatut._id, { annee_scolaire: "2022-2023" });
      // Check value in db
      const foundAfterUpdate = await dossiersApprenantsDb().findOne({ _id: createdStatut._id });
      assert.equal(foundAfterUpdate.annee_scolaire, createdStatut.annee_scolaire);
    });

    it("Vérifie qu'on ne peut pas update le champ uai_etablissement", async () => {
      const { updateDossierApprenant, createDossierApprenant } = await dossiersApprenants();

      const createdStatut = await createDossierApprenant(
        createRandomDossierApprenant({
          uai_etablissement: "0123456Z",
        })
      );
      assert.equal(createdStatut.updated_at, null);

      // First update
      await updateDossierApprenant(createdStatut._id, { uai_etablissement: "0123499X" });
      // Check value in db
      const foundAfterUpdate = await dossiersApprenantsDb().findOne({ _id: createdStatut._id });
      assert.equal(foundAfterUpdate.uai_etablissement, createdStatut.uai_etablissement);
    });

    it("Vérifie qu'on ne peut pas update le champ formation_cfd", async () => {
      const { updateDossierApprenant, createDossierApprenant } = await dossiersApprenants();

      const createdStatut = await createDossierApprenant(
        createRandomDossierApprenant({
          formation_cfd: "abcd1234",
        })
      );
      assert.equal(createdStatut.updated_at, null);

      // First update
      await updateDossierApprenant(createdStatut._id, { formation_cfd: "abcd9999" });
      // Check value in db
      const foundAfterUpdate = await dossiersApprenantsDb().findOne({ _id: createdStatut._id });
      assert.equal(foundAfterUpdate.formation_cfd, createdStatut.formation_cfd);
    });

    it("Vérifie que historique_statut_apprenant reste inchangé lorsque le statut_apprenant et date_metier_mise_a_jour_statut fournis existent déjà", async () => {
      const { updateDossierApprenant, createDossierApprenant } = await dossiersApprenants();

      const randomDossierApprenantProps = createRandomDossierApprenant({
        date_metier_mise_a_jour_statut: new Date("2022-04-01"),
        statut_apprenant: CODES_STATUT_APPRENANT.apprenti,
      });
      const createdStatut = await createDossierApprenant(randomDossierApprenantProps);

      assert.equal(createdStatut.historique_statut_apprenant.length, 1);
      assert.equal(createdStatut.historique_statut_apprenant[0].valeur_statut, CODES_STATUT_APPRENANT.apprenti);
      assert.equal(createdStatut.historique_statut_apprenant[0].date_reception.getTime(), fakeNowDate.getTime());

      // Mise à jour du statut avec le même statut_apprenant
      await updateDossierApprenant(createdStatut._id, {
        statut_apprenant: randomDossierApprenantProps.statut_apprenant,
        date_metier_mise_a_jour_statut: new Date("2022-04-01"),
      });

      // Check value in db
      const found = await dossiersApprenantsDb().findOne({ _id: createdStatut._id });
      assert.equal(found.historique_statut_apprenant.length, 1);
    });

    it("Vérifie qu'on ajoute un élément à historique_statut_apprenant lorsque le statut_apprenant et date_metier_mise_a_jour_statut fournis n'existent pas", async () => {
      const { updateDossierApprenant, createDossierApprenant } = await dossiersApprenants();

      const randomDossierApprenantProps = createRandomDossierApprenant({
        date_metier_mise_a_jour_statut: new Date("2022-04-01"),
        statut_apprenant: CODES_STATUT_APPRENANT.inscrit,
      });
      const createdStatut = await createDossierApprenant(randomDossierApprenantProps);

      assert.equal(createdStatut.historique_statut_apprenant.length, 1);
      assert.equal(createdStatut.historique_statut_apprenant[0].valeur_statut, CODES_STATUT_APPRENANT.inscrit);
      assert.equal(createdStatut.historique_statut_apprenant[0].date_reception.getTime(), fakeNowDate.getTime());

      // Mise à jour du statut avec nouveau statut_apprenant
      const updatePayload = {
        statut_apprenant: CODES_STATUT_APPRENANT.abandon,
        date_metier_mise_a_jour_statut: "2022-05-13",
      };
      MockDate.reset();
      const fakeNowDate2 = new Date();
      MockDate.set(fakeNowDate2);
      await updateDossierApprenant(createdStatut._id, updatePayload);

      // Check value in db
      const found = await dossiersApprenantsDb().findOne({ _id: createdStatut._id });
      const updatedHistorique = found.historique_statut_apprenant;
      assert.equal(updatedHistorique.length, 2);
      assert.equal(updatedHistorique[0].valeur_statut, CODES_STATUT_APPRENANT.inscrit);
      assert.equal(updatedHistorique[1].valeur_statut, CODES_STATUT_APPRENANT.abandon);
      assert.equal(
        updatedHistorique[1].date_statut.getTime(),
        new Date(updatePayload.date_metier_mise_a_jour_statut).getTime()
      );
      assert.equal(updatedHistorique[1].date_reception.getTime(), fakeNowDate2.getTime());
      assert.equal(isEqual(updatedHistorique[1].date_reception, updatedHistorique[0].date_reception), false);
    });

    it("Vérifie qu'on update historique_statut_apprenant en supprimant les éléments d'historique postérieurs à la date_metier_mise_a_jour_statut envoyée", async () => {
      const { updateDossierApprenant, createDossierApprenant } = await dossiersApprenants();

      const randomDossierApprenantProps = createRandomDossierApprenant({
        date_metier_mise_a_jour_statut: new Date(),
        statut_apprenant: CODES_STATUT_APPRENANT.apprenti,
      });
      const createdStatut = await createDossierApprenant(randomDossierApprenantProps);
      // update created statut to add an element with date_statut 90 days after now date
      await updateDossierApprenant(createdStatut._id, {
        ...randomDossierApprenantProps,
        date_metier_mise_a_jour_statut: addDays(new Date(), 90),
        statut_apprenant: CODES_STATUT_APPRENANT.inscrit,
      });

      const found1 = await dossiersApprenantsDb().findOne({ _id: createdStatut._id });
      assert.equal(found1.historique_statut_apprenant.length, 2);
      assert.equal(found1.historique_statut_apprenant[1].valeur_statut, CODES_STATUT_APPRENANT.inscrit);
      assert.equal(found1.historique_statut_apprenant[0].date_reception.getTime(), fakeNowDate.getTime());

      // update du statut avec une date antérieur au dernier élément de historique_statut_apprenant
      const updatePayload = {
        statut_apprenant: CODES_STATUT_APPRENANT.abandon,
        date_metier_mise_a_jour_statut: new Date(),
      };
      await updateDossierApprenant(createdStatut._id, { ...randomDossierApprenantProps, ...updatePayload });

      // historique should contain the new element and the one date with a later date should be removed
      const found2 = await dossiersApprenantsDb().findOne({ _id: createdStatut._id });
      assert.equal(found2.historique_statut_apprenant.length, 2);
      assert.equal(found2.historique_statut_apprenant[1].valeur_statut, updatePayload.statut_apprenant);
      assert.equal(
        found2.historique_statut_apprenant[1].date_statut.getTime(),
        updatePayload.date_metier_mise_a_jour_statut.getTime()
      );
    });

    it("Vérifie qu'on met à jour updated_at après un update", async () => {
      const { updateDossierApprenant, createDossierApprenant } = await dossiersApprenants();

      const createdStatut = await createDossierApprenant(createRandomDossierApprenant());
      assert.equal(createdStatut.updated_at, null);

      // First update
      await updateDossierApprenant(createdStatut._id, { email_contact: "mail@example.com" });
      // Check value in db
      const foundAfterFirstUpdate = await dossiersApprenantsDb().findOne({ _id: createdStatut._id });
      assert.notEqual(foundAfterFirstUpdate.email_contact, createdStatut.email_contact);
      assert.notEqual(foundAfterFirstUpdate.updated_at, null);

      // Second update
      await updateDossierApprenant(createdStatut._id, { periode_formation: [2030, 2033] });
      const foundAfterSecondUpdate = await dossiersApprenantsDb().findOne({ _id: createdStatut._id });
      assert.notEqual(foundAfterSecondUpdate.periode_formation, createdStatut.periode_formation);
      assert.notEqual(foundAfterSecondUpdate.updated_at, foundAfterFirstUpdate.updated_at);
    });
  });

  describe("createDossierApprenant", () => {
    it("Vérifie la création d'un dossierApprenant randomisé", async () => {
      const { createDossierApprenant } = await dossiersApprenants();

      const randomStatut = createRandomDossierApprenant();

      const createdStatut = await createDossierApprenant(randomStatut);

      assert.equal(createdStatut.ine_apprenant, randomStatut.ine_apprenant);
      assert.equal(createdStatut.nom_apprenant, randomStatut.nom_apprenant.toUpperCase());
      assert.equal(createdStatut.prenom_apprenant, randomStatut.prenom_apprenant.toUpperCase());
      assert.equal(createdStatut.email_contact, randomStatut.email_contact);
      assert.equal(createdStatut.formation_cfd, randomStatut.formation_cfd);
      assert.equal(createdStatut.libelle_long_formation, randomStatut.libelle_long_formation);
      assert.equal(createdStatut.uai_etablissement, randomStatut.uai_etablissement);
      assert.equal(createdStatut.siret_etablissement, randomStatut.siret_etablissement);
      assert.equal(createdStatut.nom_etablissement, randomStatut.nom_etablissement);
      assert.equal(createdStatut.source, randomStatut.source);
      assert.equal(createdStatut.annee_formation, randomStatut.annee_formation);
      assert.deepEqual(createdStatut.periode_formation, randomStatut.periode_formation);
      assert.deepEqual(createdStatut.annee_scolaire, randomStatut.annee_scolaire);
      assert.equal(createdStatut.historique_statut_apprenant.length, 1);
      assert.equal(createdStatut.historique_statut_apprenant[0].valeur_statut, randomStatut.statut_apprenant);
      assert.equal(
        createdStatut.historique_statut_apprenant[0].date_statut.getTime(),
        randomStatut.date_metier_mise_a_jour_statut.getTime()
      );
      assert.equal(createdStatut.historique_statut_apprenant[0].date_reception.getTime(), fakeNowDate.getTime());

      assert.equal(createdStatut.updated_at, null);
    });

    it("Vérifie qu'à la création d'un statut on set le champ etablissement_reseaux et qu'on récupère le réseau depuis le referentiel CFA ", async () => {
      const { createDossierApprenant } = await dossiersApprenants();
      const validUai = "0631450J";
      const reseaux = [RESEAUX_CFAS.ANASUP.nomReseau, RESEAUX_CFAS.BTP_CFA.nomReseau];

      // insert Cfa in DB
      await cfasDb().insertOne({
        uai: validUai,
        reseaux,
      });

      // Create statut
      const statutWithValidUai = { ...createRandomDossierApprenant(), uai_etablissement: validUai };
      const createdStatut = await createDossierApprenant(statutWithValidUai);

      // Check uai & reseaux in created statut
      const { etablissement_reseaux } = createdStatut;
      assert.equal(etablissement_reseaux.length, 2);
      assert.deepEqual(etablissement_reseaux, reseaux);
    });
  });

  describe("getDuplicatesList", () => {
    it("Vérifie la récupération des doublons de dossiersApprenants", async () => {
      const { createDossierApprenant } = await dossiersApprenants();

      // Create 10 random statuts
      for (let index = 0; index < 5; index++) {
        await createDossierApprenant(createRandomDossierApprenant());
      }

      // Create 3 duplicates
      const commonData = {
        formation_cfd: "01022103",
        uai_etablissement: "0762518Z",
        prenom_apprenant: "JEAN",
        nom_apprenant: "DUPONT",
        annee_scolaire: "2022-2023",
        date_de_naissance_apprenant: new Date("1990-09-20T00:00:00.000+0000"),
      };
      for (let index = 0; index < 3; index++) {
        await createDossierApprenant(createRandomDossierApprenant(commonData));
      }

      const duplicatesListFound = await getDuplicatesList(DUPLICATE_TYPE_CODES.unique.code);

      // 1 cas de doublons trouvé
      assert.equal(duplicatesListFound.length, 1);
      assert.equal(duplicatesListFound[0].duplicatesCount, 3);
      assert.equal(duplicatesListFound[0].duplicatesIds.length, 3);
      assert.deepEqual(duplicatesListFound[0].commonData, commonData);
    });

    it("Vérifie la récupération de dossiersApprenants ayant le même nom_apprenant, uai_etablissement, formation_cfd", async () => {
      const { createDossierApprenant } = await dossiersApprenants();

      // Create 10 random statuts
      for (let index = 0; index < 5; index++) {
        await createDossierApprenant(createRandomDossierApprenant());
      }

      // Create 4 statuts with same nom_apprenant, uai_etablissement, formation_cfd
      const commonData = {
        formation_cfd: "01022103",
        uai_etablissement: "0762518Z",
        nom_apprenant: "WACHOSKY",
        annee_scolaire: "2020-2021",
        date_de_naissance_apprenant: new Date("1990-09-20T00:00:00.000+0000"),
      };
      for (let index = 0; index < 4; index++) {
        await createDossierApprenant(createRandomDossierApprenant(commonData));
      }

      const duplicatesListFound = await getDuplicatesList(DUPLICATE_TYPE_CODES.prenom_apprenant.code);

      // 1 cas de doublons trouvé
      assert.equal(duplicatesListFound.length, 1);
      assert.equal(duplicatesListFound[0].duplicatesCount, 4);
      assert.equal(duplicatesListFound[0].duplicatesIds.length, 4);
      assert.deepEqual(duplicatesListFound[0].commonData, commonData);
      assert.deepEqual(duplicatesListFound[0].discriminants.prenom_apprenants.length, 4);
    });

    it("Vérifie la récupération des doublons de dossiersApprenants n'ayant jamais eu d'update", async () => {
      const { createDossierApprenant, addOrUpdateDossiersApprenants } = await dossiersApprenants();

      // Create 10 random statuts
      for (let index = 0; index < 0; index++) {
        await createDossierApprenant(createRandomDossierApprenant());
      }

      // Create 2 duplicates for Jean Dupont
      const firstDupUnicityKey = {
        formation_cfd: "01022103",
        uai_etablissement: "0762518Z",
        prenom_apprenant: "JEAN",
        nom_apprenant: "DUPONT",
        annee_scolaire: "2022-2023",
        date_de_naissance_apprenant: new Date("1990-09-20T00:00:00.000+0000"),
        statut_apprenant: CODES_STATUT_APPRENANT.apprenti,
      };
      await createDossierApprenant(createRandomDossierApprenant(firstDupUnicityKey));
      await createDossierApprenant(createRandomDossierApprenant(firstDupUnicityKey));

      // create 2 duplicates and update one of them with a new statut_apprenant
      const secondDup = {
        formation_cfd: "01022106",
        uai_etablissement: "0769888P",
        prenom_apprenant: "John",
        nom_apprenant: "Doe",
        annee_scolaire: "2021-2022",
        date_de_naissance_apprenant: new Date("1990-12-20T00:00:00.000+0000"),
        statut_apprenant: CODES_STATUT_APPRENANT.abandon,
      };
      await createDossierApprenant(createRandomDossierApprenant(secondDup));
      await createDossierApprenant(createRandomDossierApprenant(secondDup));
      await addOrUpdateDossiersApprenants([
        createRandomDossierApprenant({
          ...secondDup,
          statut_apprenant: CODES_STATUT_APPRENANT.inscrit,
          date_metier_mise_a_jour_statut: new Date(),
        }),
      ]);

      const duplicatesListFound = await getDuplicatesList(
        DUPLICATE_TYPE_CODES.unique.code,
        {},
        { duplicatesWithNoUpdate: true }
      );

      // 1 cas de doublons trouvé
      assert.equal(duplicatesListFound.length, 1);
      assert.equal(duplicatesListFound[0].duplicatesCount, 2);
      assert.equal(duplicatesListFound[0].duplicatesIds.length, 2);
      assert.deepEqual(duplicatesListFound[0].commonData.prenom_apprenant, firstDupUnicityKey.prenom_apprenant);
      assert.deepEqual(duplicatesListFound[0].commonData.nom_apprenant, firstDupUnicityKey.nom_apprenant);
    });

    it("Vérifie la récupération des doublons d'uai", async () => {
      const { createDossierApprenant } = await dossiersApprenants();

      // Create 10 random statuts without duplicates
      for (let index = 0; index < 5; index++) {
        await createDossierApprenant(createRandomDossierApprenant());
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
        await createDossierApprenant(
          createRandomDossierApprenant({ ...commonData, uai_etablissement: getRandomUaiEtablissement() })
        );
      }

      const duplicatesListFound = await getDuplicatesList(DUPLICATE_TYPE_CODES.uai_etablissement.code);

      // 1 cas de doublons trouvé avec 4 doublons
      assert.equal(duplicatesListFound.length, 1);
      assert.equal(duplicatesListFound[0].duplicatesCount, 4);
      assert.equal(duplicatesListFound[0].discriminants.duplicatesCreatedDatesAndIds.length, 4);
    });
  });
});
