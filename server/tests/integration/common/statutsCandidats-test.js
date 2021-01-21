const assert = require("assert");
const integrationTests = require("../../utils/integrationTests");
const statutsCandidats = require("../../../src/common/components/statutsCandidats");
const { StatutCandidat } = require("../../../src/common/model");
const { codesStatutsMajStatutCandidats, codesStatutsCandidats } = require("../../../src/common/model/constants");
const {
  statutsTest,
  statutsTestUpdate,
  simpleStatut,
  simpleStatutBadUpdate,
  simpleProspectStatut,
} = require("../../data/sample");
const { createRandomStatutCandidat } = require("../../data/randomizedSample");
const { asyncForEach } = require("../../../src/common/utils/asyncUtils");

integrationTests(__filename, () => {
  it("Vérifie l'existence d'un statut de candidat randomisé", async () => {
    const { existsStatut } = await statutsCandidats();

    const randomStatut = createRandomStatutCandidat();

    const toAdd = new StatutCandidat(randomStatut);
    await toAdd.save();
    const result = toAdd.toJSON();

    // Checks creation
    assert.strictEqual(result.ine_apprenant, randomStatut.ine_apprenant);
    assert.strictEqual(result.nom_apprenant, randomStatut.nom_apprenant);
    assert.strictEqual(result.prenom_apprenant, randomStatut.prenom_apprenant);
    assert.strictEqual(result.prenom2_apprenant, randomStatut.prenom2_apprenant);
    assert.strictEqual(result.prenom3_apprenant, randomStatut.prenom3_apprenant);
    assert.strictEqual(result.ne_pas_solliciter, randomStatut.ne_pas_solliciter);
    assert.strictEqual(result.email_contact, randomStatut.email_contact);
    assert.strictEqual(result.nom_representant_legal, randomStatut.nom_representant_legal);
    assert.strictEqual(result.tel_representant_legal, randomStatut.tel_representant_legal);
    assert.strictEqual(result.tel2_representant_legal, randomStatut.tel2_representant_legal);
    assert.strictEqual(result.id_formation, randomStatut.id_formation);
    assert.strictEqual(result.libelle_court_formation, randomStatut.libelle_court_formation);
    assert.strictEqual(result.libelle_long_formation, randomStatut.libelle_long_formation);
    assert.strictEqual(result.uai_etablissement, randomStatut.uai_etablissement);
    assert.strictEqual(result.siret_etablissement, randomStatut.siret_etablissement);
    assert.strictEqual(result.nom_etablissement, randomStatut.nom_etablissement);
    assert.strictEqual(result.statut_apprenant, randomStatut.statut_apprenant);
    assert.strictEqual(result.source, randomStatut.source);
    assert.strictEqual(result.annee_formation, randomStatut.annee_formation);
    assert.deepStrictEqual(result.periode_formation, randomStatut.periode_formation);

    // Checks exists method
    const found = await existsStatut({
      ine_apprenant: result.ine_apprenant,
      nom_apprenant: result.nom_apprenant,
      prenom_apprenant: result.prenom_apprenant,
      prenom2_apprenant: result.prenom2_apprenant,
      prenom3_apprenant: result.prenom3_apprenant,
      email_contact: result.email_contact,
      id_formation: result.id_formation,
      uai_etablissement: result.uai_etablissement,
      siret_etablissement: result.siret_etablissement,
      annee_formation: result.annee_formation,
      periode_formation: result.periode_formation,
    });
    assert.strictEqual(found, true);
  });

  it("Vérifie l'existence d'un statut de candidat avec INE", async () => {
    const { existsStatut } = await statutsCandidats();

    const toAdd = new StatutCandidat(statutsTest[0]);
    await toAdd.save();
    const result = toAdd.toJSON();

    // Checks creation
    assert.strictEqual(result.ine_apprenant, statutsTest[0].ine_apprenant);
    assert.strictEqual(result.nom_apprenant, statutsTest[0].nom_apprenant);
    assert.strictEqual(result.prenom_apprenant, statutsTest[0].prenom_apprenant);
    assert.strictEqual(result.prenom2_apprenant, null);
    assert.strictEqual(result.prenom3_apprenant, null);
    assert.strictEqual(result.ne_pas_solliciter, statutsTest[0].ne_pas_solliciter);
    assert.strictEqual(result.email_contact, statutsTest[0].email_contact);
    assert.strictEqual(result.nom_representant_legal, statutsTest[0].nom_representant_legal);
    assert.strictEqual(result.tel_representant_legal, statutsTest[0].tel_representant_legal);
    assert.strictEqual(result.tel2_representant_legal, statutsTest[0].tel2_representant_legal);
    assert.strictEqual(result.id_formation, statutsTest[0].id_formation);
    assert.strictEqual(result.libelle_court_formation, statutsTest[0].libelle_court_formation);
    assert.strictEqual(result.libelle_long_formation, statutsTest[0].libelle_long_formation);
    assert.strictEqual(result.uai_etablissement, statutsTest[0].uai_etablissement);
    assert.strictEqual(result.siret_etablissement, statutsTest[0].siret_etablissement);
    assert.strictEqual(result.nom_etablissement, statutsTest[0].nom_etablissement);
    assert.strictEqual(result.statut_apprenant, statutsTest[0].statut_apprenant);
    assert.strictEqual(result.source, statutsTest[0].source);
    assert.strictEqual(result.annee_formation, statutsTest[0].annee_formation);
    assert.deepStrictEqual(result.periode_formation, statutsTest[0].periode_formation);

    // Checks exists method
    const found = await existsStatut({
      ine_apprenant: result.ine_apprenant,
      id_formation: result.id_formation,
      uai_etablissement: result.uai_etablissement,
      siret_etablissement: result.siret_etablissement,
      periode_formation: result.periode_formation,
      annee_formation: result.annee_formation,
    });
    assert.strictEqual(found, true);
  });

  it("Vérifie l'existence d'un statut de candidat avec un mauvais INE", async () => {
    const { existsStatut } = await statutsCandidats();

    const toAdd = new StatutCandidat(statutsTest[0]);
    await toAdd.save();

    // Checks exists method
    const found = await existsStatut({
      ine_apprenant: "BAD_INE",
      id_formation: toAdd.id_formation,
      uai_etablissement: toAdd.uai_etablissement,
      siret_etablissement: toAdd.siret_etablissement,
    });
    assert.strictEqual(found, false);
  });

  it("Vérifie l'existence d'un statut de candidat avec les Nom, Prénoms & Email", async () => {
    const { existsStatut } = await statutsCandidats();

    const toAdd = new StatutCandidat(statutsTest[0]);
    await toAdd.save();

    // Checks exists method
    const found = await existsStatut({
      nom_apprenant: toAdd.nom_apprenant,
      prenom_apprenant: toAdd.prenom_apprenant,
      prenom2_apprenant: toAdd.prenom2_apprenant,
      prenom3_apprenant: toAdd.prenom3_apprenant,
      email_contact: toAdd.email_contact,

      id_formation: toAdd.id_formation,
      uai_etablissement: toAdd.uai_etablissement,
      siret_etablissement: toAdd.siret_etablissement,
      periode_formation: toAdd.periode_formation,
      annee_formation: toAdd.annee_formation,
    });
    assert.strictEqual(found, true);
  });

  it("Vérifie l'existence d'un statut de candidat avec mauvais Nom, Prénoms & Email", async () => {
    const { existsStatut } = await statutsCandidats();

    const toAdd = new StatutCandidat(statutsTest[0]);
    await toAdd.save();

    // Checks exists method
    const found = await existsStatut({
      nom_apprenant: "BAD_NAME",
      prenom_apprenant: toAdd.prenom_apprenant,
      prenom2_apprenant: toAdd.prenom2_apprenant,
      prenom3_apprenant: toAdd.prenom3_apprenant,
      email_contact: toAdd.email_contact,

      id_formation: toAdd.id_formation,
      uai_etablissement: toAdd.uai_etablissement,
      siret_etablissement: toAdd.siret_etablissement,
      periode_formation: toAdd.periode_formation,
      annee_formation: toAdd.annee_formation,
    });
    assert.strictEqual(found, false);
  });

  it("Vérifie l'existence d'un mauvais statut de candidat sur la formation", async () => {
    const { existsStatut } = await statutsCandidats();

    const toAdd = new StatutCandidat(statutsTest[0]);
    await toAdd.save();

    // Checks exists method with bad id formation
    const found = await existsStatut({
      ine_apprenant: toAdd.ine_apprenant,
      id_formation: "BAD_ID_FORMATION",
      uai_etablissement: toAdd.uai_etablissement,
      siret_etablissement: toAdd.siret_etablissement,
      periode_formation: toAdd.periode_formation,
      annee_formation: toAdd.annee_formation,
    });
    assert.strictEqual(found, false);
  });

  it("Vérifie la récupération d'un statut sur l'INE", async () => {
    const { getStatut } = await statutsCandidats();

    const toAdd = new StatutCandidat(statutsTest[0]);
    await toAdd.save();

    // Checks exists method
    const found = await getStatut({
      ine_apprenant: toAdd.ine_apprenant,
      id_formation: toAdd.id_formation,
      uai_etablissement: toAdd.uai_etablissement,
      siret_etablissement: toAdd.siret_etablissement,
      periode_formation: toAdd.periode_formation,
      annee_formation: toAdd.annee_formation,
    });

    assert.notStrictEqual(found, null);
    assert.strictEqual(found.ine_apprenant, statutsTest[0].ine_apprenant);
    assert.strictEqual(found.nom_apprenant, statutsTest[0].nom_apprenant);
    assert.strictEqual(found.prenom_apprenant, statutsTest[0].prenom_apprenant);
    assert.strictEqual(found.prenom2_apprenant, null);
    assert.strictEqual(found.prenom3_apprenant, null);
    assert.strictEqual(found.ne_pas_solliciter, statutsTest[0].ne_pas_solliciter);
    assert.strictEqual(found.email_contact, statutsTest[0].email_contact);
    assert.strictEqual(found.nom_representant_legal, statutsTest[0].nom_representant_legal);
    assert.strictEqual(found.tel_representant_legal, statutsTest[0].tel_representant_legal);
    assert.strictEqual(found.tel2_representant_legal, statutsTest[0].tel2_representant_legal);
    assert.strictEqual(found.id_formation, statutsTest[0].id_formation);
    assert.strictEqual(found.libelle_court_formation, statutsTest[0].libelle_court_formation);
    assert.strictEqual(found.libelle_long_formation, statutsTest[0].libelle_long_formation);
    assert.strictEqual(found.uai_etablissement, statutsTest[0].uai_etablissement);
    assert.strictEqual(found.siret_etablissement, statutsTest[0].siret_etablissement);
    assert.strictEqual(found.nom_etablissement, statutsTest[0].nom_etablissement);
    assert.strictEqual(found.statut_apprenant, statutsTest[0].statut_apprenant);
  });

  it("Vérifie la récupération d'un statut sur les Nom, Prénoms & Email", async () => {
    const { getStatut } = await statutsCandidats();

    const toAdd = new StatutCandidat(statutsTest[0]);
    await toAdd.save();

    // Checks exists method
    const found = await getStatut({
      nom_apprenant: toAdd.nom_apprenant,
      prenom_apprenant: toAdd.prenom_apprenant,
      prenom2_apprenant: toAdd.prenom2_apprenant,
      prenom3_apprenant: toAdd.prenom3_apprenant,
      email_contact: toAdd.email_contact,

      id_formation: toAdd.id_formation,
      uai_etablissement: toAdd.uai_etablissement,
      siret_etablissement: toAdd.siret_etablissement,
      periode_formation: toAdd.periode_formation,
      annee_formation: toAdd.annee_formation,
    });

    assert.notDeepStrictEqual(found, null);
    assert.strictEqual(found.ine_apprenant, statutsTest[0].ine_apprenant);
    assert.strictEqual(found.nom_apprenant, statutsTest[0].nom_apprenant);
    assert.strictEqual(found.prenom_apprenant, statutsTest[0].prenom_apprenant);
    assert.strictEqual(found.prenom2_apprenant, null);
    assert.strictEqual(found.prenom3_apprenant, null);
    assert.strictEqual(found.ne_pas_solliciter, statutsTest[0].ne_pas_solliciter);
    assert.strictEqual(found.email_contact, statutsTest[0].email_contact);
    assert.strictEqual(found.nom_representant_legal, statutsTest[0].nom_representant_legal);
    assert.strictEqual(found.tel_representant_legal, statutsTest[0].tel_representant_legal);
    assert.strictEqual(found.tel2_representant_legal, statutsTest[0].tel2_representant_legal);
    assert.strictEqual(found.id_formation, statutsTest[0].id_formation);
    assert.strictEqual(found.libelle_court_formation, statutsTest[0].libelle_court_formation);
    assert.strictEqual(found.libelle_long_formation, statutsTest[0].libelle_long_formation);
    assert.strictEqual(found.uai_etablissement, statutsTest[0].uai_etablissement);
    assert.strictEqual(found.siret_etablissement, statutsTest[0].siret_etablissement);
    assert.strictEqual(found.nom_etablissement, statutsTest[0].nom_etablissement);
    assert.strictEqual(found.statut_apprenant, statutsTest[0].statut_apprenant);
  });

  it("Vérifie la mauvaise récupération d'un statut sur un mauvais INE", async () => {
    const { getStatut } = await statutsCandidats();

    const toAdd = new StatutCandidat(statutsTest[0]);
    await toAdd.save();

    // Checks exists method
    const found = await getStatut({
      ine_apprenant: "BAD_INE",
      id_formation: toAdd.id_formation,
      uai_etablissement: toAdd.uai_etablissement,
      siret_etablissement: toAdd.siret_etablissement,
    });
    assert.strictEqual(found, null);
  });

  it("Vérifie la mauvaise récupération d'un statut sur mauvais Nom, Prénoms & Email", async () => {
    const { getStatut } = await statutsCandidats();

    const toAdd = new StatutCandidat(statutsTest[0]);
    await toAdd.save();

    // Checks exists method
    const found = await getStatut({
      nom_apprenant: "BAD_NAME",
      prenom_apprenant: toAdd.prenom_apprenant,
      prenom2_apprenant: toAdd.prenom2_apprenant,
      prenom3_apprenant: toAdd.prenom3_apprenant,
      email_contact: toAdd.email_contact,

      id_formation: toAdd.id_formation,
      uai_etablissement: toAdd.uai_etablissement,
      siret_etablissement: toAdd.siret_etablissement,
    });
    assert.strictEqual(found, null);
  });

  it("Vérifie l'ajout ou la mise à jour d'un statut'", async () => {
    const { addOrUpdateStatuts } = await statutsCandidats();

    // Add statuts test
    await asyncForEach(statutsTest, async (statutTest) => {
      await addOrUpdateStatuts([statutTest]);
    });

    // Checks addOrUpdateStatuts method
    assert.strictEqual(await StatutCandidat.countDocuments({}), statutsTest.length);
    const { added, updated } = await addOrUpdateStatuts(statutsTestUpdate);

    // Check added
    assert.strictEqual(added.length, 1);
    const foundAdded = await StatutCandidat.findById(added[0]._id);
    assert.strictEqual(foundAdded.ine_apprenant, statutsTestUpdate[3].ine_apprenant);
    assert.strictEqual(foundAdded.nom_apprenant, statutsTestUpdate[3].nom_apprenant);
    assert.strictEqual(foundAdded.prenom_apprenant, statutsTestUpdate[3].prenom_apprenant);
    assert.strictEqual(foundAdded.ne_pas_solliciter, statutsTestUpdate[3].ne_pas_solliciter);
    assert.strictEqual(foundAdded.email_contact, statutsTestUpdate[3].email_contact);
    assert.strictEqual(foundAdded.id_formation, statutsTestUpdate[3].id_formation);
    assert.strictEqual(foundAdded.uai_etablissement, statutsTestUpdate[3].uai_etablissement);
    assert.strictEqual(foundAdded.siret_etablissement, statutsTestUpdate[3].siret_etablissement);
    assert.strictEqual(foundAdded.statut_apprenant, statutsTestUpdate[3].statut_apprenant);
    assert.strictEqual(foundAdded.updated_at, null);
    assert.strictEqual(foundAdded.annee_formation, statutsTestUpdate[3].annee_formation);
    assert.deepStrictEqual(foundAdded.periode_formation, statutsTestUpdate[3].periode_formation);

    // Check updated
    assert.strictEqual(updated.length, 3);

    const firstUpdated = await StatutCandidat.findById(updated[0]._id);
    assert.strictEqual(firstUpdated.ine_apprenant, statutsTestUpdate[0].ine_apprenant);
    assert.strictEqual(firstUpdated.nom_apprenant, statutsTestUpdate[0].nom_apprenant);
    assert.strictEqual(firstUpdated.prenom_apprenant, statutsTestUpdate[0].prenom_apprenant);
    assert.strictEqual(firstUpdated.ne_pas_solliciter, statutsTestUpdate[0].ne_pas_solliciter);
    assert.strictEqual(firstUpdated.email_contact, statutsTestUpdate[0].email_contact);
    assert.strictEqual(firstUpdated.nom_representant_legal, statutsTestUpdate[0].nom_representant_legal);
    assert.strictEqual(firstUpdated.tel_representant_legal, statutsTestUpdate[0].tel_representant_legal);
    assert.strictEqual(firstUpdated.tel2_representant_legal, statutsTestUpdate[0].tel2_representant_legal);
    assert.strictEqual(firstUpdated.nom_representant_legal, statutsTestUpdate[0].nom_representant_legal);
    assert.strictEqual(firstUpdated.id_formation, statutsTestUpdate[0].id_formation);
    assert.strictEqual(firstUpdated.libelle_court_formation, statutsTestUpdate[0].libelle_court_formation);
    assert.strictEqual(firstUpdated.libelle_long_formation, statutsTestUpdate[0].libelle_long_formation);
    assert.strictEqual(firstUpdated.uai_etablissement, statutsTestUpdate[0].uai_etablissement);
    assert.strictEqual(firstUpdated.siret_etablissement, statutsTestUpdate[0].siret_etablissement);
    assert.strictEqual(firstUpdated.nom_etablissement, statutsTestUpdate[0].nom_etablissement);
    assert.strictEqual(firstUpdated.statut_apprenant, statutsTestUpdate[0].statut_apprenant);
    assert.ok(firstUpdated.date_mise_a_jour_statut);
    assert.ok(firstUpdated.updated_at);

    const secondUpdated = await StatutCandidat.findById(updated[1]._id);
    assert.strictEqual(secondUpdated.ine_apprenant, statutsTestUpdate[1].ine_apprenant);
    assert.strictEqual(secondUpdated.nom_apprenant, statutsTestUpdate[1].nom_apprenant);
    assert.strictEqual(secondUpdated.prenom_apprenant, statutsTestUpdate[1].prenom_apprenant);
    assert.strictEqual(secondUpdated.ne_pas_solliciter, statutsTestUpdate[1].ne_pas_solliciter);
    assert.strictEqual(secondUpdated.email_contact, statutsTestUpdate[1].email_contact);
    assert.strictEqual(secondUpdated.id_formation, statutsTestUpdate[1].id_formation);
    assert.strictEqual(secondUpdated.uai_etablissement, statutsTestUpdate[1].uai_etablissement);
    assert.strictEqual(secondUpdated.siret_etablissement, statutsTestUpdate[1].siret_etablissement);
    assert.strictEqual(secondUpdated.nom_etablissement, statutsTestUpdate[1].nom_etablissement);
    assert.strictEqual(secondUpdated.statut_apprenant, statutsTestUpdate[1].statut_apprenant);
    assert.ok(secondUpdated.date_mise_a_jour_statut);
    assert.ok(secondUpdated.updated_at);

    const thirdUpdated = await StatutCandidat.findById(updated[2]._id);
    assert.strictEqual(thirdUpdated.nom_apprenant, statutsTestUpdate[2].nom_apprenant);
    assert.strictEqual(thirdUpdated.prenom_apprenant, statutsTestUpdate[2].prenom_apprenant);
    assert.strictEqual(thirdUpdated.ne_pas_solliciter, statutsTestUpdate[2].ne_pas_solliciter);
    assert.strictEqual(thirdUpdated.email_contact, statutsTestUpdate[2].email_contact);
    assert.strictEqual(thirdUpdated.id_formation, statutsTestUpdate[2].id_formation);
    assert.strictEqual(thirdUpdated.uai_etablissement, statutsTestUpdate[2].uai_etablissement);
    assert.strictEqual(thirdUpdated.siret_etablissement, statutsTestUpdate[2].siret_etablissement);
    assert.strictEqual(thirdUpdated.nom_etablissement, statutsTestUpdate[2].nom_etablissement);
    assert.strictEqual(thirdUpdated.statut_apprenant, statutsTestUpdate[2].statut_apprenant);
    assert.ok(thirdUpdated.date_mise_a_jour_statut);
    assert.ok(thirdUpdated.updated_at);
  });

  it("Vérifie l'ajout ou la mise à jour d'un statut avec erreur de cohérence sur le statut", async () => {
    const { addOrUpdateStatuts } = await statutsCandidats();

    // Add statut test
    await addOrUpdateStatuts([simpleStatut]);

    // Checks addOrUpdateStatuts method
    const { updated } = await addOrUpdateStatuts([simpleStatutBadUpdate]);

    // Check added
    assert.strictEqual(updated.length, 1);
    const found = await StatutCandidat.findById(updated[0]._id);
    assert.strictEqual(found.ine_apprenant, simpleStatutBadUpdate.ine_apprenant);
    assert.strictEqual(found.nom_apprenant, simpleStatutBadUpdate.nom_apprenant);
    assert.strictEqual(found.prenom_apprenant, simpleStatutBadUpdate.prenom_apprenant);
    assert.strictEqual(found.ne_pas_solliciter, simpleStatutBadUpdate.ne_pas_solliciter);
    assert.strictEqual(found.email_contact, simpleStatutBadUpdate.email_contact);
    assert.strictEqual(found.id_formation, simpleStatutBadUpdate.id_formation);
    assert.strictEqual(found.uai_etablissement, simpleStatutBadUpdate.uai_etablissement);
    assert.strictEqual(found.siret_etablissement, simpleStatutBadUpdate.siret_etablissement);
    assert.strictEqual(found.statut_apprenant, simpleStatutBadUpdate.statut_apprenant);
    assert.strictEqual(found.statut_mise_a_jour_statut, codesStatutsMajStatutCandidats.ko);
    assert.notDeepStrictEqual(found.erreur_mise_a_jour_statut, null);
    assert.notDeepStrictEqual(found.updated_at, null);
  });

  it("Vérifie la récupération de l'historique simple d'un statut", async () => {
    const { addOrUpdateStatuts, getStatutHistory } = await statutsCandidats();

    // Add statut test
    const { added } = await addOrUpdateStatuts([simpleProspectStatut]);

    // Mise à jour du statut
    const simpleStatutChangedInsc = { ...simpleProspectStatut, statut_apprenant: codesStatutsCandidats.inscrit };
    await addOrUpdateStatuts([simpleStatutChangedInsc]);

    // Check value in db
    const found = await StatutCandidat.findById(added[0]._id);
    assert.strictEqual(found.ine_apprenant, simpleProspectStatut.ine_apprenant);
    assert.strictEqual(found.nom_apprenant, simpleProspectStatut.nom_apprenant);
    assert.strictEqual(found.prenom_apprenant, simpleProspectStatut.prenom_apprenant);
    assert.strictEqual(found.ne_pas_solliciter, simpleProspectStatut.ne_pas_solliciter);
    assert.strictEqual(found.email_contact, simpleProspectStatut.email_contact);
    assert.strictEqual(found.id_formation, simpleProspectStatut.id_formation);
    assert.strictEqual(found.uai_etablissement, simpleProspectStatut.uai_etablissement);
    assert.strictEqual(found.siret_etablissement, simpleProspectStatut.siret_etablissement);
    // Check updated value
    assert.strictEqual(found.statut_apprenant, codesStatutsCandidats.inscrit);
    assert.strictEqual(found.statut_mise_a_jour_statut, codesStatutsMajStatutCandidats.ok);
    assert.strictEqual(found.erreur_mise_a_jour_statut, null);
    assert.notDeepStrictEqual(found.updated_at, null);

    // Check history
    const history = await getStatutHistory(simpleProspectStatut);
    assert.strictEqual(history.length, 2);
    assert.strictEqual(history[0].position_statut, 1);
    assert.strictEqual(history[0].valeur_statut, simpleProspectStatut.statut_apprenant);
    assert.strictEqual(history[1].position_statut, 2);
    assert.strictEqual(history[1].valeur_statut, simpleStatutChangedInsc.statut_apprenant);
  });

  it("Vérifie qu'on met à jour updated_at après un update", async () => {
    const { updateStatut, addOrUpdateStatuts, getStatut } = await statutsCandidats();

    const randomStatut = createRandomStatutCandidat();
    await addOrUpdateStatuts([randomStatut]);
    const createdStatut = await getStatut(randomStatut);

    // First update
    await updateStatut(createdStatut._id, { prenom_apprenant: "André-Pierre" });
    // Check value in db
    const foundAfterFirstUpdate = await StatutCandidat.findById(createdStatut._id);
    assert.notStrictEqual(foundAfterFirstUpdate.prenom_apprenant, createdStatut.prenom_apprenant);
    assert.notStrictEqual(foundAfterFirstUpdate.updated_at, createdStatut.updated_at);

    // Second update
    await updateStatut(createdStatut._id, { nom_apprenant: "Gignac" });
    const foundAfterSecondUpdate = await StatutCandidat.findById(createdStatut._id);
    assert.notStrictEqual(foundAfterSecondUpdate.nom_apprenant, createdStatut.nom_apprenant);
    assert.notStrictEqual(foundAfterSecondUpdate.updated_at, foundAfterFirstUpdate.updated_at);
  });

  it("Vérifie qu'on update historique_statut_apprenant quand un nouveau statut_apprenant est envoyé", async () => {
    const { updateStatut, addOrUpdateStatuts, getStatut } = await statutsCandidats();

    // Add statut with invalid uai
    await addOrUpdateStatuts([simpleProspectStatut]);
    const createdStatut = await getStatut(simpleProspectStatut);

    assert.strictEqual(createdStatut.historique_statut_apprenant.length, 1);
    assert.strictEqual(createdStatut.historique_statut_apprenant[0].valeur_statut, createdStatut.statut_apprenant);
    assert.strictEqual(createdStatut.historique_statut_apprenant[0].position_statut, 1);

    // Mise à jour du statut avec nouveau statut_apprenant
    await updateStatut(createdStatut._id, { statut_apprenant: codesStatutsCandidats.abandon });

    // Check value in db
    const found = await StatutCandidat.findById(createdStatut._id);
    assert.strictEqual(found.historique_statut_apprenant.length, 2);
    assert.strictEqual(found.historique_statut_apprenant[0].valeur_statut, createdStatut.statut_apprenant);
    assert.strictEqual(found.historique_statut_apprenant[0].position_statut, 1);
    assert.strictEqual(found.historique_statut_apprenant[1].valeur_statut, codesStatutsCandidats.abandon);
    assert.strictEqual(found.historique_statut_apprenant[1].position_statut, 2);
  });

  it("Vérifie qu'on update PAS historique_statut_apprenant quand un statut_apprenant identique à l'actuel est envoyé", async () => {
    const { updateStatut, addOrUpdateStatuts, getStatut } = await statutsCandidats();

    // Add statut with invalid uai
    await addOrUpdateStatuts([simpleProspectStatut]);
    const createdStatut = await getStatut(simpleProspectStatut);

    assert.deepStrictEqual(createdStatut.historique_statut_apprenant.length, 1);
    assert.deepStrictEqual(createdStatut.historique_statut_apprenant[0].valeur_statut, createdStatut.statut_apprenant);
    assert.deepStrictEqual(createdStatut.historique_statut_apprenant[0].position_statut, 1);

    // Mise à jour du statut avec le même statut_apprenant
    await updateStatut(createdStatut._id, { statut_apprenant: codesStatutsCandidats.prospect });

    // Check value in db
    const found = await StatutCandidat.findById(createdStatut._id);
    assert.strictEqual(found.historique_statut_apprenant.length, 1);
  });

  it("Vérifie l'update d'un uai invalide vers valide pour un statut", async () => {
    const { updateStatut, addOrUpdateStatuts, getStatut } = await statutsCandidats();

    // Add statut with invalid uai
    const statutWithInvalidUai = { ...createRandomStatutCandidat(), uai_etablissement: "invalid-uai" };
    await addOrUpdateStatuts([statutWithInvalidUai]);
    const createdStatut = await getStatut(statutWithInvalidUai);

    assert.strictEqual(createdStatut.uai_etablissement_valid, false);

    // Mise à jour du statut avec uai valide
    await updateStatut(createdStatut._id, { uai_etablissement: "0000009S" });

    // Check value in db
    const found = await StatutCandidat.findById(createdStatut._id);
    assert.strictEqual(found.uai_etablissement_valid, true);
  });

  it("Vérifie l'update d'un siret invalide vers valide pour un statut", async () => {
    const { updateStatut, addOrUpdateStatuts, getStatut } = await statutsCandidats();

    // Add statut with invalid siret
    const statutWithInvalidSiret = { ...createRandomStatutCandidat(), siret_etablissement: "invalid-siret" };
    await addOrUpdateStatuts([statutWithInvalidSiret]);
    const createdStatut = await getStatut(statutWithInvalidSiret);

    assert.strictEqual(createdStatut.siret_etablissement_valid, false);

    // Mise à jour du statut avec siret valide
    await updateStatut(createdStatut._id, { siret_etablissement: "80490173800023" });

    // Check value in db
    const found = await StatutCandidat.findById(createdStatut._id);
    assert.strictEqual(found.siret_etablissement_valid, true);
  });
});
