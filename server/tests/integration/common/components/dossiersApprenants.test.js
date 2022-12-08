// import { strict as assert } from "assert";

// // eslint-disable-next-line node/no-unpublished-require
// import MockDate from "mockdate";

import { addDays, isEqual } from "date-fns";
import dossiersApprenants from "../../../../src/common/components/dossiersApprenants.js";
import {
  createRandomDossierApprenant as createRandomDossierApprenantProps,
  getRandomUaiEtablissement,
  getRandomFormationCfd,
  getRandomAnneeScolaire,
} from "../../../data/randomizedSample.js";
import { CODES_STATUT_APPRENANT } from "../../../../src/common/constants/dossierApprenantConstants.js";
import { RESEAUX_CFAS } from "../../../../src/common/constants/networksConstants.js";
import { cfasDb, dossiersApprenantsDb } from "../../../../src/common/model/collections.js";

// describe("Components Dossiers Apprenants Test", () => {
//   let fakeNowDate;
//   beforeEach(() => {
//     fakeNowDate = new Date();
//     MockDate.set(fakeNowDate);
//   });

//   afterEach(() => {
//     MockDate.reset();
//   });

  describe("getDossierApprenant", () => {
    it("Vérifie la récupération d'un statut sur les champs d'unicité : id_erp_apprenant, uai_etablissement et annee_scolaire", async () => {
      const { getDossierApprenant, createDossierApprenant } = await dossiersApprenants();

      const randomDossierApprenantProps = createRandomDossierApprenantProps();
      const createdDossierApprenant = await createDossierApprenant(randomDossierApprenantProps);

      const found = await getDossierApprenant({
        id_erp_apprenant: randomDossierApprenantProps.id_erp_apprenant,
        uai_etablissement: randomDossierApprenantProps.uai_etablissement,
        annee_scolaire: randomDossierApprenantProps.annee_scolaire,
      });

      assert.equal(found._id.equals(createdDossierApprenant._id.toString()), true);
    });

    const unicityCriterion = [
      { field: "uai_etablissement", changedValue: getRandomUaiEtablissement() },
      { field: "formation_cfd", changedValue: getRandomFormationCfd() },
      { field: "annee_scolaire", changedValue: getRandomAnneeScolaire() },
    ];

    unicityCriterion.forEach((unicityCriteria) => {
      it(`Vérifie qu'on ne retrouve pas un dossier apprenant créé quand le champ ${unicityCriteria.field} a changé`, async () => {
        const { getDossierApprenant, createDossierApprenant } = await dossiersApprenants();

        const randomDossierApprenantProps = createRandomDossierApprenantProps({
          annee_scolaire: ["2021-2021"],
        });
        await createDossierApprenant(randomDossierApprenantProps);

        const found = await getDossierApprenant({
          uai_etablissement: randomDossierApprenantProps.uai_etablissement,
          annee_scolaire: randomDossierApprenantProps.annee_scolaire,
          [unicityCriteria.field]: unicityCriteria.changedValue,
        });
        assert.equal(found, null);
      });
    });
  });

  describe("addOrUpdateDossiersApprenants", () => {
    it("met à jour le dossier apprenant lorsque qu'un dossier avec même critère d'unicité est trouvé en base", async () => {
      const { addOrUpdateDossiersApprenants } = await dossiersApprenants();

      const unicityFields = {
        id_erp_apprenant: "abc1234xyz",
        annee_scolaire: "2023-2024",
        uai_etablissement: "0123456Z",
      };
      const dossierApprenantProps = createRandomDossierApprenantProps({ ...unicityFields, email_contact: "" });

      await addOrUpdateDossiersApprenants([dossierApprenantProps]);
      assert.equal(await dossiersApprenantsDb().countDocuments(), 1);

      const slightlyChangedDossierApprenant = createRandomDossierApprenantProps({
        ...unicityFields,
        email_contact: "example@mail.com",
      });
      const result = await addOrUpdateDossiersApprenants([slightlyChangedDossierApprenant]);

      assert.equal(result.added.length, 0);
      assert.equal(result.updated.length, 1);
      assert.equal(await dossiersApprenantsDb().countDocuments(), 1);
      const dossierApprenantInDb = await dossiersApprenantsDb().findOne();
      assert.equal(dossierApprenantInDb.email_contact, slightlyChangedDossierApprenant.email_contact);
      assert.equal(dossierApprenantInDb.id_erp_apprenant, unicityFields.id_erp_apprenant);
      assert.equal(dossierApprenantInDb.annee_scolaire, unicityFields.annee_scolaire);
      assert.equal(dossierApprenantInDb.uai_etablissement, unicityFields.uai_etablissement);
      assert.notEqual(dossierApprenantInDb.updated_at, null);
    });

    it("crée un nouveau dossier apprenant si un dossier est présent en base avec les mêmes champs SAUF le champ d'unicité id_erp_apprenant", async () => {
      const { addOrUpdateDossiersApprenants } = await dossiersApprenants();

      const unicityFields = {
        id_erp_apprenant: "abc1234xyz",
        annee_scolaire: "2023-2024",
        uai_etablissement: "0123456Z",
      };
      const dossierApprenantProps = createRandomDossierApprenantProps(unicityFields);

      await addOrUpdateDossiersApprenants([dossierApprenantProps]);
      assert.equal(await dossiersApprenantsDb().countDocuments(), 1);

      const unicityFieldsChangedDossierApprenant = createRandomDossierApprenantProps({
        ...unicityFields,
        id_erp_apprenant: "123abc",
      });
      const result = await addOrUpdateDossiersApprenants([unicityFieldsChangedDossierApprenant]);
      assert.equal(result.added.length, 1);
      assert.equal(result.updated.length, 0);
      assert.equal(await dossiersApprenantsDb().countDocuments(), 2);
    });
    it("crée un nouveau dossier apprenant si un dossier est présent en base avec les mêmes champs SAUF le champ d'unicité uai_etablissement", async () => {
      const { addOrUpdateDossiersApprenants } = await dossiersApprenants();

      const unicityFields = {
        id_erp_apprenant: "abc1234xyz",
        annee_scolaire: "2023-2024",
        uai_etablissement: "0123456Z",
      };
      const dossierApprenantProps = createRandomDossierApprenantProps(unicityFields);

      await addOrUpdateDossiersApprenants([dossierApprenantProps]);
      assert.equal(await dossiersApprenantsDb().countDocuments(), 1);

      const unicityFieldsChangedDossierApprenant = createRandomDossierApprenantProps({
        ...unicityFields,
        uai_etablissement: "0123456X",
      });
      const result = await addOrUpdateDossiersApprenants([unicityFieldsChangedDossierApprenant]);
      assert.equal(result.added.length, 1);
      assert.equal(result.updated.length, 0);
      assert.equal(await dossiersApprenantsDb().countDocuments(), 2);
    });
    it("crée un nouveau dossier apprenant si un dossier est présent en base avec les mêmes champs SAUF le champ d'unicité annee_scolaire", async () => {
      const { addOrUpdateDossiersApprenants } = await dossiersApprenants();

      const unicityFields = {
        id_erp_apprenant: "abc1234xyz",
        annee_scolaire: "2025-2026",
        uai_etablissement: "0123456Z",
      };
      const dossierApprenantProps = createRandomDossierApprenantProps(unicityFields);

      await addOrUpdateDossiersApprenants([dossierApprenantProps]);
      assert.equal(await dossiersApprenantsDb().countDocuments(), 1);

      const unicityFieldsChangedDossierApprenant = createRandomDossierApprenantProps({
        ...unicityFields,
        id_erp_apprenant: "123abc",
      });
      const result = await addOrUpdateDossiersApprenants([unicityFieldsChangedDossierApprenant]);
      assert.equal(result.added.length, 1);
      assert.equal(result.updated.length, 0);
      assert.equal(await dossiersApprenantsDb().countDocuments(), 2);
    });

    const nonUnicityCriteriaFields = [
      { key: "prenom_apprenant", creationValue: "ANTOINE", updateValue: "OUSMANE" },
      { key: "nom_apprenant", creationValue: "GRIEZMANN", updateValue: "DEMBELE" },
      { key: "formation_cfd", creationValue: "40321111", updateValue: "40321404" },
      { key: "annee_formation", creationValue: 1, updateValue: 2 },
      { key: "periode_formation", creationValue: [2021, 2024], updateValue: [2021, 2025] },
      { key: "formation_rncp", creationValue: "RNCP34945", updateValue: "RNCP12345" },
      { key: "ine_apprenant", creationValue: "1234A12345F", updateValue: "1234567890F" },
      { key: "email_contact", creationValue: "a.griezmann@mail.com", updateValue: "o.dembele@mail.com" },
      { key: "libelle_long_formation", creationValue: "MILIEU OFFENSIF", updateValue: "AILIER DROIT" },
      { key: "siret_etablissement", creationValue: "19020052700017", updateValue: "19020031100016" },
      { key: "nom_etablissement", creationValue: "OF A", updateValue: "OF B" },
      { key: "tel_apprenant", creationValue: "0601020304", updateValue: "0701020304" },
      { key: "code_commune_insee_apprenant", creationValue: "75001", updateValue: "75002" },
      {
        key: "date_de_naissance_apprenant",
        creationValue: new Date("1991-03-21"),
        updateValue: new Date("1997-05-15"),
      },
      { key: "contrat_date_debut", creationValue: null, updateValue: new Date("2022-12-01") },
      { key: "contrat_date_fin", creationValue: null, updateValue: new Date("2024-12-01") },
      { key: "contrat_date_rupture", creationValue: null, updateValue: new Date("2023-01-15") },
    ];

    nonUnicityCriteriaFields.forEach(({ key, creationValue, updateValue }) => {
      it(`ne crée pas mais met à jour un dossier apprenant quand seul le champ ${key} est différent du dossier apprenant en base`, async () => {
        const { addOrUpdateDossiersApprenants } = await dossiersApprenants();

        const randomDossierApprenantProps = createRandomDossierApprenantProps({
          [key]: creationValue,
        });
        const result1 = await addOrUpdateDossiersApprenants([randomDossierApprenantProps]);
        assert.equal(result1.added.length, 1);
        assert.equal(result1.updated.length, 0);

        const result2 = await addOrUpdateDossiersApprenants([{ ...randomDossierApprenantProps, [key]: updateValue }]);
        assert.equal(result2.added.length, 0);
        assert.equal(result2.updated.length, 1);
        assert.equal(await dossiersApprenantsDb().countDocuments(), 1);
        const updatedDossier = result2.updated[0];
        assert.deepEqual(updatedDossier[key], updateValue);
        assert.notEqual(updatedDossier.updated_at, null);
      });
    });
  });

  describe("updateDossierApprenant", () => {
    it("Vérifie qu'on ne peut pas update le champ id_erp_apprenant", async () => {
      const { updateDossierApprenant, createDossierApprenant } = await dossiersApprenants();

      const createdDossierApprenant = await createDossierApprenant(
        createRandomDossierApprenantProps({
          id_erp_apprenant: "uuid1111",
        })
      );
      assert.equal(createdDossierApprenant.updated_at, null);

      await updateDossierApprenant(createdDossierApprenant._id, { id_erp_apprenant: "uuid2222" });
      const foundAfterUpdate = await dossiersApprenantsDb().findOne({ _id: createdDossierApprenant._id });
      assert.equal(foundAfterUpdate.id_erp_apprenant, createdDossierApprenant.id_erp_apprenant);
    });

    it("Vérifie qu'on ne peut pas update le champ uai_etablissement", async () => {
      const { updateDossierApprenant, createDossierApprenant } = await dossiersApprenants();

      const createdDossierApprenant = await createDossierApprenant(
        createRandomDossierApprenantProps({
          uai_etablissement: "0123456Z",
        })
      );
      assert.equal(createdDossierApprenant.updated_at, null);

      await updateDossierApprenant(createdDossierApprenant._id, { uai_etablissement: "0123456Z" });
      const foundAfterUpdate = await dossiersApprenantsDb().findOne({ _id: createdDossierApprenant._id });
      assert.equal(foundAfterUpdate.uai_etablissement, createdDossierApprenant.uai_etablissement);
    });

    it("Vérifie qu'on ne peut pas update le champ annee_scolaire", async () => {
      const { updateDossierApprenant, createDossierApprenant } = await dossiersApprenants();

      const createdDossierApprenant = await createDossierApprenant(
        createRandomDossierApprenantProps({
          annee_scolaire: "2022-2023",
        })
      );
      assert.equal(createdDossierApprenant.updated_at, null);

      await updateDossierApprenant(createdDossierApprenant._id, { annee_scolaire: "2023-2024" });
      const foundAfterUpdate = await dossiersApprenantsDb().findOne({ _id: createdDossierApprenant._id });
      assert.equal(foundAfterUpdate.annee_scolaire, createdDossierApprenant.annee_scolaire);
    });

    it("update les champs autorisés en base", async () => {
      const { createDossierApprenant, updateDossierApprenant } = await dossiersApprenants();

      const randomDossierApprenantProps = createRandomDossierApprenantProps();
      const created = await createDossierApprenant(randomDossierApprenantProps);

      const updatePayload = {
        prenom_apprenant: "OUSMANE",
        nom_apprenant: "DEMBELE",
        formation_cfd: "40321404",
        annee_formation: 2,
        periode_formation: [2021, 2025],
        formation_rncp: "RNCP12345",
        ine_apprenant: "1234567890F",
        email_contact: "o.dembele@mail.com",
        libelle_long_formation: "AILIER DROIT",
        siret_etablissement: "19020031100016",
        nom_etablissement: "OF B",
        tel_apprenant: "0701020304",
        code_commune_insee_apprenant: "75002",
        date_de_naissance_apprenant: new Date("1997-05-15"),
        contrat_date_debut: new Date("2022-12-01"),
        contrat_date_fin: new Date("2024-12-01"),
        contrat_date_rupture: new Date("2023-01-15"),
      };
      await updateDossierApprenant(created._id, updatePayload);
      const foundAfterUpdate = await dossiersApprenantsDb().findOne({ _id: created._id });
      assert.deepEqual(foundAfterUpdate.prenom_apprenant, updatePayload.prenom_apprenant);
      assert.deepEqual(foundAfterUpdate.nom_apprenant, updatePayload.nom_apprenant);
      assert.deepEqual(foundAfterUpdate.formation_cfd, updatePayload.formation_cfd);
      assert.deepEqual(foundAfterUpdate.annee_formation, updatePayload.annee_formation);
      assert.deepEqual(foundAfterUpdate.periode_formation, updatePayload.periode_formation);
      assert.deepEqual(foundAfterUpdate.formation_rncp, updatePayload.formation_rncp);
      assert.deepEqual(foundAfterUpdate.ine_apprenant, updatePayload.ine_apprenant);
      assert.deepEqual(foundAfterUpdate.email_contact, updatePayload.email_contact);
      assert.deepEqual(foundAfterUpdate.libelle_long_formation, updatePayload.libelle_long_formation);
      assert.deepEqual(foundAfterUpdate.siret_etablissement, updatePayload.siret_etablissement);
      assert.deepEqual(foundAfterUpdate.nom_etablissement, updatePayload.nom_etablissement);
      assert.deepEqual(foundAfterUpdate.tel_apprenant, updatePayload.tel_apprenant);
      assert.deepEqual(foundAfterUpdate.code_commune_insee_apprenant, updatePayload.code_commune_insee_apprenant);
      assert.deepEqual(foundAfterUpdate.date_de_naissance_apprenant, updatePayload.date_de_naissance_apprenant);
      assert.deepEqual(foundAfterUpdate.contrat_date_debut, updatePayload.contrat_date_debut);
      assert.deepEqual(foundAfterUpdate.contrat_date_fin, updatePayload.contrat_date_fin);
      assert.deepEqual(foundAfterUpdate.contrat_date_rupture, updatePayload.contrat_date_rupture);
    });

    it("Vérifie que historique_statut_apprenant reste inchangé lorsque le statut_apprenant et date_metier_mise_a_jour_statut fournis existent déjà", async () => {
      const { updateDossierApprenant, createDossierApprenant } = await dossiersApprenants();

      const randomDossierApprenantProps = createRandomDossierApprenantProps({
        date_metier_mise_a_jour_statut: new Date("2022-04-01"),
        statut_apprenant: CODES_STATUT_APPRENANT.apprenti,
      });
      const createdDossierApprenant = await createDossierApprenant(randomDossierApprenantProps);

      assert.equal(createdDossierApprenant.historique_statut_apprenant.length, 1);
      assert.equal(
        createdDossierApprenant.historique_statut_apprenant[0].valeur_statut,
        CODES_STATUT_APPRENANT.apprenti
      );
      assert.equal(
        createdDossierApprenant.historique_statut_apprenant[0].date_reception.getTime(),
        fakeNowDate.getTime()
      );

      // Mise à jour du statut avec le même statut_apprenant
      await updateDossierApprenant(createdDossierApprenant._id, {
        statut_apprenant: randomDossierApprenantProps.statut_apprenant,
        date_metier_mise_a_jour_statut: new Date("2022-04-01"),
      });

      // Check value in db
      const found = await dossiersApprenantsDb().findOne({ _id: createdDossierApprenant._id });
      assert.equal(found.historique_statut_apprenant.length, 1);
    });

//     it("Vérifie qu'on ajoute un élément à historique_statut_apprenant lorsque le statut_apprenant et date_metier_mise_a_jour_statut fournis n'existent pas", async () => {
//       const { updateDossierApprenant, createDossierApprenant } = await dossiersApprenants();

      const randomDossierApprenantProps = createRandomDossierApprenantProps({
        date_metier_mise_a_jour_statut: new Date("2022-04-01"),
        statut_apprenant: CODES_STATUT_APPRENANT.inscrit,
      });
      const createdDossierApprenant = await createDossierApprenant(randomDossierApprenantProps);

      assert.equal(createdDossierApprenant.historique_statut_apprenant.length, 1);
      assert.equal(
        createdDossierApprenant.historique_statut_apprenant[0].valeur_statut,
        CODES_STATUT_APPRENANT.inscrit
      );
      assert.equal(
        createdDossierApprenant.historique_statut_apprenant[0].date_reception.getTime(),
        fakeNowDate.getTime()
      );

      // Mise à jour du statut avec nouveau statut_apprenant
      const updatePayload = {
        statut_apprenant: CODES_STATUT_APPRENANT.abandon,
        date_metier_mise_a_jour_statut: "2022-05-13",
      };
      MockDate.reset();
      const fakeNowDate2 = new Date();
      MockDate.set(fakeNowDate2);
      await updateDossierApprenant(createdDossierApprenant._id, updatePayload);

      // Check value in db
      const found = await dossiersApprenantsDb().findOne({ _id: createdDossierApprenant._id });
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

//     it("Vérifie qu'on update historique_statut_apprenant en supprimant les éléments d'historique postérieurs à la date_metier_mise_a_jour_statut envoyée", async () => {
//       const { updateDossierApprenant, createDossierApprenant } = await dossiersApprenants();

      const randomDossierApprenantProps = createRandomDossierApprenantProps({
        date_metier_mise_a_jour_statut: new Date(),
        statut_apprenant: CODES_STATUT_APPRENANT.apprenti,
      });
      const createdDossierApprenant = await createDossierApprenant(randomDossierApprenantProps);
      // update created statut to add an element with date_statut 90 days after now date
      await updateDossierApprenant(createdDossierApprenant._id, {
        ...randomDossierApprenantProps,
        date_metier_mise_a_jour_statut: addDays(new Date(), 90),
        statut_apprenant: CODES_STATUT_APPRENANT.inscrit,
      });

      const found1 = await dossiersApprenantsDb().findOne({ _id: createdDossierApprenant._id });
      assert.equal(found1.historique_statut_apprenant.length, 2);
      assert.equal(found1.historique_statut_apprenant[1].valeur_statut, CODES_STATUT_APPRENANT.inscrit);
      assert.equal(found1.historique_statut_apprenant[0].date_reception.getTime(), fakeNowDate.getTime());

      // update du statut avec une date antérieur au dernier élément de historique_statut_apprenant
      const updatePayload = {
        statut_apprenant: CODES_STATUT_APPRENANT.abandon,
        date_metier_mise_a_jour_statut: new Date(),
      };
      await updateDossierApprenant(createdDossierApprenant._id, { ...randomDossierApprenantProps, ...updatePayload });

      // historique should contain the new element and the one date with a later date should be removed
      const found2 = await dossiersApprenantsDb().findOne({ _id: createdDossierApprenant._id });
      assert.equal(found2.historique_statut_apprenant.length, 2);
      assert.equal(found2.historique_statut_apprenant[1].valeur_statut, updatePayload.statut_apprenant);
      assert.equal(
        found2.historique_statut_apprenant[1].date_statut.getTime(),
        updatePayload.date_metier_mise_a_jour_statut.getTime()
      );
    });

//     it("Vérifie qu'on met à jour updated_at après un update", async () => {
//       const { updateDossierApprenant, createDossierApprenant } = await dossiersApprenants();

      const createdDossierApprenant = await createDossierApprenant(createRandomDossierApprenantProps());
      assert.equal(createdDossierApprenant.updated_at, null);

      // First update
      await updateDossierApprenant(createdDossierApprenant._id, { email_contact: "mail@example.com" });
      // Check value in db
      const foundAfterFirstUpdate = await dossiersApprenantsDb().findOne({ _id: createdDossierApprenant._id });
      assert.notEqual(foundAfterFirstUpdate.email_contact, createdDossierApprenant.email_contact);
      assert.notEqual(foundAfterFirstUpdate.updated_at, null);

      // Second update
      await updateDossierApprenant(createdDossierApprenant._id, { periode_formation: [2030, 2033] });
      const foundAfterSecondUpdate = await dossiersApprenantsDb().findOne({ _id: createdDossierApprenant._id });
      assert.notEqual(foundAfterSecondUpdate.periode_formation, createdDossierApprenant.periode_formation);
      assert.notEqual(foundAfterSecondUpdate.updated_at, foundAfterFirstUpdate.updated_at);
    });
  });

//   describe("createDossierApprenant", () => {
//     it("Vérifie la création d'un dossierApprenant randomisé", async () => {
//       const { createDossierApprenant } = await dossiersApprenants();

      const randomDossierApprenantProps = createRandomDossierApprenantProps();

      const createdDossierApprenant = await createDossierApprenant(randomDossierApprenantProps);

      assert.equal(createdDossierApprenant.ine_apprenant, randomDossierApprenantProps.ine_apprenant);
      assert.equal(createdDossierApprenant.nom_apprenant, randomDossierApprenantProps.nom_apprenant.toUpperCase());
      assert.equal(
        createdDossierApprenant.prenom_apprenant,
        randomDossierApprenantProps.prenom_apprenant.toUpperCase()
      );
      assert.equal(createdDossierApprenant.email_contact, randomDossierApprenantProps.email_contact);
      assert.equal(createdDossierApprenant.formation_cfd, randomDossierApprenantProps.formation_cfd);
      assert.equal(createdDossierApprenant.libelle_long_formation, randomDossierApprenantProps.libelle_long_formation);
      assert.equal(createdDossierApprenant.uai_etablissement, randomDossierApprenantProps.uai_etablissement);
      assert.equal(createdDossierApprenant.siret_etablissement, randomDossierApprenantProps.siret_etablissement);
      assert.equal(createdDossierApprenant.nom_etablissement, randomDossierApprenantProps.nom_etablissement);
      assert.equal(createdDossierApprenant.source, randomDossierApprenantProps.source);
      assert.equal(createdDossierApprenant.annee_formation, randomDossierApprenantProps.annee_formation);
      assert.deepEqual(createdDossierApprenant.periode_formation, randomDossierApprenantProps.periode_formation);
      assert.deepEqual(createdDossierApprenant.annee_scolaire, randomDossierApprenantProps.annee_scolaire);
      assert.equal(createdDossierApprenant.historique_statut_apprenant.length, 1);
      assert.equal(
        createdDossierApprenant.historique_statut_apprenant[0].valeur_statut,
        randomDossierApprenantProps.statut_apprenant
      );
      assert.equal(
        createdDossierApprenant.historique_statut_apprenant[0].date_statut.getTime(),
        randomDossierApprenantProps.date_metier_mise_a_jour_statut.getTime()
      );
      assert.equal(
        createdDossierApprenant.historique_statut_apprenant[0].date_reception.getTime(),
        fakeNowDate.getTime()
      );

      assert.equal(createdDossierApprenant.updated_at, null);
    });

    it("Vérifie qu'à la création d'un dossier apprenant on set le champ etablissement_reseaux et qu'on récupère le réseau depuis le referentiel CFA ", async () => {
      const { createDossierApprenant } = await dossiersApprenants();
      const validUai = "0631450J";
      const reseaux = [RESEAUX_CFAS.ANASUP.nomReseau, RESEAUX_CFAS.BTP_CFA.nomReseau];

//       // insert Cfa in DB
//       await cfasDb().insertOne({
//         uai: validUai,
//         reseaux,
//       });

      // Create dossier apprenant
      const statutWithValidUai = { ...createRandomDossierApprenantProps(), uai_etablissement: validUai };
      const createdDossierApprenant = await createDossierApprenant(statutWithValidUai);

      // Check uai & reseaux in created dossier apprenant
      const { etablissement_reseaux } = createdDossierApprenant;
      assert.equal(etablissement_reseaux.length, 2);
      assert.deepEqual(etablissement_reseaux, reseaux);
    });
  });
});

// describe("getCfaFirstTransmissionDateFromUai", () => {
//   const { getCfaFirstTransmissionDateFromUai } = cfasComponent();
//   const uaiToSearch = "0762290X";
//   const firstDate = new Date("2020-08-30T00:00:00.000+0000");
//   const dossierApprenantSeed = [
//     {
//       ...createRandomDossierApprenant(),
//       uai_etablissement: uaiToSearch,
//       created_at: addDays(firstDate, 2),
//     },
//     {
//       ...createRandomDossierApprenant(),
//       uai_etablissement: uaiToSearch,
//       created_at: firstDate,
//     },
//     {
//       ...createRandomDossierApprenant(),
//       uai_etablissement: uaiToSearch,
//       created_at: addDays(firstDate, 3),
//     },
//     {
//       ...createRandomDossierApprenant(),
//       uai_etablissement: uaiToSearch,
//       created_at: addDays(firstDate, 4),
//     },
//   ];
//   beforeEach(async () => {
//     for (let i = 0; i < dossierApprenantSeed.length; i++) {
//       const dossierApprenant = dossierApprenantSeed[i];
//       await dossiersApprenantsDb().insertOne(dossierApprenant);
//     }
//   });
//   it("returns null when no parameter passed", async () => {
//     const firstTransmissionDateFromNoUaiParameter = await getCfaFirstTransmissionDateFromUai();
//     assert.deepEqual(firstTransmissionDateFromNoUaiParameter, null);
//   });
//   it("returns null when bad uai is passed", async () => {
//     const firstTransmissionDateFromBadUai = await getCfaFirstTransmissionDateFromUai("00000000");
//     assert.deepEqual(firstTransmissionDateFromBadUai, null);
//   });
//   it("returns first date when good uai is passed", async () => {
//     const firstTransmissionDateFromGoodUai = await getCfaFirstTransmissionDateFromUai(uaiToSearch);
//     assert.deepEqual(firstTransmissionDateFromGoodUai, firstDate);
//   });
// });

// describe("getCfaFirstTransmissionDateFromSiret", () => {
//   const { getCfaFirstTransmissionDateFromSiret } = cfasComponent();
//   const siretToSearch = "80420010000024";
//   const firstDate = new Date("2020-06-10T00:00:00.000+0000");
//   const dossierApprenantSeed = [
//     {
//       ...createRandomDossierApprenant(),
//       siret_etablissement: siretToSearch,
//       created_at: addDays(firstDate, 2),
//     },
//     {
//       ...createRandomDossierApprenant(),
//       siret_etablissement: siretToSearch,
//       created_at: addDays(firstDate, 3),
//     },
//     {
//       ...createRandomDossierApprenant(),
//       siret_etablissement: siretToSearch,
//       created_at: firstDate,
//     },
//     {
//       ...createRandomDossierApprenant(),
//       siret_etablissement: siretToSearch,
//       created_at: addDays(firstDate, 4),
//     },
//   ];
//   beforeEach(async () => {
//     for (let i = 0; i < dossierApprenantSeed.length; i++) {
//       const dossierApprenant = dossierApprenantSeed[i];
//       await dossiersApprenantsDb().insertOne(dossierApprenant);
//     }
//   });
//   it("returns null when no parameter passed", async () => {
//     const firstTransmissionDateFromNoSiretParameter = await getCfaFirstTransmissionDateFromSiret();
//     assert.deepEqual(firstTransmissionDateFromNoSiretParameter, null);
//   });
//   it("returns null when bad siret is passed", async () => {
//     const firstTransmissionDateFromBadSiret = await getCfaFirstTransmissionDateFromSiret("00000000000000");
//     assert.deepEqual(firstTransmissionDateFromBadSiret, null);
//   });
//   it("returns first date when good siret is passed", async () => {
//     const getCfaFirstTransmissionDateFromGoodSiret = await getCfaFirstTransmissionDateFromSiret(siretToSearch);
//     assert.deepEqual(getCfaFirstTransmissionDateFromGoodSiret, firstDate);
//   });
// });
