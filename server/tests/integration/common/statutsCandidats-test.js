const assert = require("assert");
const integrationTests = require("../../utils/integrationTests");
const statutsCandidats = require("../../../src/common/components/statutsCandidats");
const { StatutCandidat } = require("../../../src/common/model");
const { codesStatutsMajStatutCandidats } = require("../../../src/common/model/constants");
const { statutsTest, statutsTestUpdate, simpleStatut, simpleStatutBadUpdate } = require("../../utils/fixtures");
const { asyncForEach } = require("../../../src/common/utils/asyncUtils");

integrationTests(__filename, () => {
  it("Permet de vérifier l'existence d'un statut de candidat avec INE", async () => {
    const { existsStatut } = await statutsCandidats();

    const toAdd = new StatutCandidat(statutsTest[0]);
    await toAdd.save();

    // Checks creation
    assert.strictEqual(toAdd.ine_apprenant, statutsTest[0].ine_apprenant);
    assert.strictEqual(toAdd.nom_apprenant, statutsTest[0].nom_apprenant);
    assert.strictEqual(toAdd.prenom_apprenant, statutsTest[0].prenom_apprenant);
    assert.strictEqual(toAdd.prenom2_apprenant, null);
    assert.strictEqual(toAdd.prenom3_apprenant, null);
    assert.strictEqual(toAdd.ne_pas_solliciter, statutsTest[0].ne_pas_solliciter);
    assert.strictEqual(toAdd.email_contact, statutsTest[0].email_contact);
    assert.strictEqual(toAdd.nom_representant_legal, statutsTest[0].nom_representant_legal);
    assert.strictEqual(toAdd.tel_representant_legal, statutsTest[0].tel_representant_legal);
    assert.strictEqual(toAdd.tel2_representant_legal, statutsTest[0].tel2_representant_legal);
    assert.strictEqual(toAdd.id_formation, statutsTest[0].id_formation);
    assert.strictEqual(toAdd.libelle_court_formation, statutsTest[0].libelle_court_formation);
    assert.strictEqual(toAdd.libelle_long_formation, statutsTest[0].libelle_long_formation);
    assert.strictEqual(toAdd.uai_etablissement, statutsTest[0].uai_etablissement);
    assert.strictEqual(toAdd.nom_etablissement, statutsTest[0].nom_etablissement);
    assert.strictEqual(toAdd.statut_apprenant, statutsTest[0].statut_apprenant);

    // Checks exists method
    const found = await existsStatut({
      ine_apprenant: toAdd.ine_apprenant,
      id_formation: toAdd.id_formation,
      uai_etablissement: toAdd.uai_etablissement,
    });
    assert.strictEqual(found, true);
  });

  it("Permet de vérifier l'existence d'un statut de candidat avec un mauvais INE", async () => {
    const { existsStatut } = await statutsCandidats();

    const toAdd = new StatutCandidat(statutsTest[0]);
    await toAdd.save();

    // Checks creation
    assert.strictEqual(toAdd.ine_apprenant, statutsTest[0].ine_apprenant);
    assert.strictEqual(toAdd.nom_apprenant, statutsTest[0].nom_apprenant);
    assert.strictEqual(toAdd.prenom_apprenant, statutsTest[0].prenom_apprenant);
    assert.strictEqual(toAdd.prenom2_apprenant, null);
    assert.strictEqual(toAdd.prenom3_apprenant, null);
    assert.strictEqual(toAdd.ne_pas_solliciter, statutsTest[0].ne_pas_solliciter);
    assert.strictEqual(toAdd.email_contact, statutsTest[0].email_contact);
    assert.strictEqual(toAdd.nom_representant_legal, statutsTest[0].nom_representant_legal);
    assert.strictEqual(toAdd.tel_representant_legal, statutsTest[0].tel_representant_legal);
    assert.strictEqual(toAdd.tel2_representant_legal, statutsTest[0].tel2_representant_legal);
    assert.strictEqual(toAdd.id_formation, statutsTest[0].id_formation);
    assert.strictEqual(toAdd.libelle_court_formation, statutsTest[0].libelle_court_formation);
    assert.strictEqual(toAdd.libelle_long_formation, statutsTest[0].libelle_long_formation);
    assert.strictEqual(toAdd.uai_etablissement, statutsTest[0].uai_etablissement);
    assert.strictEqual(toAdd.nom_etablissement, statutsTest[0].nom_etablissement);
    assert.strictEqual(toAdd.statut_apprenant, statutsTest[0].statut_apprenant);

    // Checks exists method
    const found = await existsStatut({
      ine_apprenant: "BAD_INE",
      id_formation: toAdd.id_formation,
      uai_etablissement: toAdd.uai_etablissement,
    });
    assert.strictEqual(found, false);
  });

  it("Permet de vérifier l'existence d'un statut de candidat avec les Nom, Prénoms & Email", async () => {
    const { existsStatut } = await statutsCandidats();

    const toAdd = new StatutCandidat(statutsTest[0]);
    await toAdd.save();

    // Checks creation
    assert.strictEqual(toAdd.ine_apprenant, statutsTest[0].ine_apprenant);
    assert.strictEqual(toAdd.nom_apprenant, statutsTest[0].nom_apprenant);
    assert.strictEqual(toAdd.prenom_apprenant, statutsTest[0].prenom_apprenant);
    assert.strictEqual(toAdd.prenom2_apprenant, null);
    assert.strictEqual(toAdd.prenom3_apprenant, null);
    assert.strictEqual(toAdd.ne_pas_solliciter, statutsTest[0].ne_pas_solliciter);
    assert.strictEqual(toAdd.email_contact, statutsTest[0].email_contact);
    assert.strictEqual(toAdd.nom_representant_legal, statutsTest[0].nom_representant_legal);
    assert.strictEqual(toAdd.tel_representant_legal, statutsTest[0].tel_representant_legal);
    assert.strictEqual(toAdd.tel2_representant_legal, statutsTest[0].tel2_representant_legal);
    assert.strictEqual(toAdd.id_formation, statutsTest[0].id_formation);
    assert.strictEqual(toAdd.libelle_court_formation, statutsTest[0].libelle_court_formation);
    assert.strictEqual(toAdd.libelle_long_formation, statutsTest[0].libelle_long_formation);
    assert.strictEqual(toAdd.uai_etablissement, statutsTest[0].uai_etablissement);
    assert.strictEqual(toAdd.nom_etablissement, statutsTest[0].nom_etablissement);
    assert.strictEqual(toAdd.statut_apprenant, statutsTest[0].statut_apprenant);

    // Checks exists method
    const found = await existsStatut({
      nom_apprenant: toAdd.nom_apprenant,
      prenom_apprenant: toAdd.prenom_apprenant,
      prenom2_apprenant: toAdd.prenom2_apprenant,
      prenom3_apprenant: toAdd.prenom3_apprenant,
      email_contact: toAdd.email_contact,

      id_formation: toAdd.id_formation,
      uai_etablissement: toAdd.uai_etablissement,
    });
    assert.strictEqual(found, true);
  });

  it("Permet de vérifier l'existence d'un statut de candidat avec mauvais Nom, Prénoms & Email", async () => {
    const { existsStatut } = await statutsCandidats();

    const toAdd = new StatutCandidat(statutsTest[0]);
    await toAdd.save();

    // Checks creation
    assert.strictEqual(toAdd.ine_apprenant, statutsTest[0].ine_apprenant);
    assert.strictEqual(toAdd.nom_apprenant, statutsTest[0].nom_apprenant);
    assert.strictEqual(toAdd.prenom_apprenant, statutsTest[0].prenom_apprenant);
    assert.strictEqual(toAdd.prenom2_apprenant, null);
    assert.strictEqual(toAdd.prenom3_apprenant, null);
    assert.strictEqual(toAdd.ne_pas_solliciter, statutsTest[0].ne_pas_solliciter);
    assert.strictEqual(toAdd.email_contact, statutsTest[0].email_contact);
    assert.strictEqual(toAdd.nom_representant_legal, statutsTest[0].nom_representant_legal);
    assert.strictEqual(toAdd.tel_representant_legal, statutsTest[0].tel_representant_legal);
    assert.strictEqual(toAdd.tel2_representant_legal, statutsTest[0].tel2_representant_legal);
    assert.strictEqual(toAdd.id_formation, statutsTest[0].id_formation);
    assert.strictEqual(toAdd.libelle_court_formation, statutsTest[0].libelle_court_formation);
    assert.strictEqual(toAdd.libelle_long_formation, statutsTest[0].libelle_long_formation);
    assert.strictEqual(toAdd.uai_etablissement, statutsTest[0].uai_etablissement);
    assert.strictEqual(toAdd.nom_etablissement, statutsTest[0].nom_etablissement);
    assert.strictEqual(toAdd.statut_apprenant, statutsTest[0].statut_apprenant);

    // Checks exists method
    const found = await existsStatut({
      nom_apprenant: "BAD_NAME",
      prenom_apprenant: toAdd.prenom_apprenant,
      prenom2_apprenant: toAdd.prenom2_apprenant,
      prenom3_apprenant: toAdd.prenom3_apprenant,
      email_contact: toAdd.email_contact,

      id_formation: toAdd.id_formation,
      uai_etablissement: toAdd.uai_etablissement,
    });
    assert.strictEqual(found, false);
  });

  it("Permet de vérifier l'existence d'un mauvais statut de candidat sur la formation", async () => {
    const { existsStatut } = await statutsCandidats();

    const toAdd = new StatutCandidat(statutsTest[0]);
    await toAdd.save();

    // Checks creation
    assert.strictEqual(toAdd.ine_apprenant, statutsTest[0].ine_apprenant);
    assert.strictEqual(toAdd.nom_apprenant, statutsTest[0].nom_apprenant);
    assert.strictEqual(toAdd.prenom_apprenant, statutsTest[0].prenom_apprenant);
    assert.strictEqual(toAdd.prenom2_apprenant, null);
    assert.strictEqual(toAdd.prenom3_apprenant, null);
    assert.strictEqual(toAdd.ne_pas_solliciter, statutsTest[0].ne_pas_solliciter);
    assert.strictEqual(toAdd.email_contact, statutsTest[0].email_contact);
    assert.strictEqual(toAdd.nom_representant_legal, statutsTest[0].nom_representant_legal);
    assert.strictEqual(toAdd.tel_representant_legal, statutsTest[0].tel_representant_legal);
    assert.strictEqual(toAdd.tel2_representant_legal, statutsTest[0].tel2_representant_legal);
    assert.strictEqual(toAdd.id_formation, statutsTest[0].id_formation);
    assert.strictEqual(toAdd.libelle_court_formation, statutsTest[0].libelle_court_formation);
    assert.strictEqual(toAdd.libelle_long_formation, statutsTest[0].libelle_long_formation);
    assert.strictEqual(toAdd.uai_etablissement, statutsTest[0].uai_etablissement);
    assert.strictEqual(toAdd.nom_etablissement, statutsTest[0].nom_etablissement);
    assert.strictEqual(toAdd.statut_apprenant, statutsTest[0].statut_apprenant);

    // Checks exists method with bad id formation
    const found = await existsStatut({
      ine_apprenant: toAdd.ine_apprenant,
      id_formation: "BAD_ID_FORMATION",
      uai_etablissement: toAdd.uai_etablissement,
    });
    assert.strictEqual(found, false);
  });

  it("Permet de vérifier l'existence avec vérification de valeur d'un statut de candidat avec INE", async () => {
    const { existsWithStatutValue } = await statutsCandidats();

    const toAdd = new StatutCandidat(statutsTest[0]);
    await toAdd.save();

    // Checks creation
    assert.strictEqual(toAdd.ine_apprenant, statutsTest[0].ine_apprenant);
    assert.strictEqual(toAdd.nom_apprenant, statutsTest[0].nom_apprenant);
    assert.strictEqual(toAdd.prenom_apprenant, statutsTest[0].prenom_apprenant);
    assert.strictEqual(toAdd.prenom2_apprenant, null);
    assert.strictEqual(toAdd.prenom3_apprenant, null);
    assert.strictEqual(toAdd.ne_pas_solliciter, statutsTest[0].ne_pas_solliciter);
    assert.strictEqual(toAdd.email_contact, statutsTest[0].email_contact);
    assert.strictEqual(toAdd.nom_representant_legal, statutsTest[0].nom_representant_legal);
    assert.strictEqual(toAdd.tel_representant_legal, statutsTest[0].tel_representant_legal);
    assert.strictEqual(toAdd.tel2_representant_legal, statutsTest[0].tel2_representant_legal);
    assert.strictEqual(toAdd.id_formation, statutsTest[0].id_formation);
    assert.strictEqual(toAdd.libelle_court_formation, statutsTest[0].libelle_court_formation);
    assert.strictEqual(toAdd.libelle_long_formation, statutsTest[0].libelle_long_formation);
    assert.strictEqual(toAdd.uai_etablissement, statutsTest[0].uai_etablissement);
    assert.strictEqual(toAdd.nom_etablissement, statutsTest[0].nom_etablissement);
    assert.strictEqual(toAdd.statut_apprenant, statutsTest[0].statut_apprenant);

    // Checks exists method
    const found = await existsWithStatutValue({
      ine_apprenant: toAdd.ine_apprenant,
      id_formation: toAdd.id_formation,
      uai_etablissement: toAdd.uai_etablissement,
      statut_apprenant: toAdd.statut_apprenant,
    });
    assert.strictEqual(found, true);
  });

  it("Permet de vérifier l'existence avec vérification de valeur d'un statut de candidat avec mauvais INE", async () => {
    const { existsWithStatutValue } = await statutsCandidats();

    const toAdd = new StatutCandidat(statutsTest[0]);
    await toAdd.save();

    // Checks creation
    assert.strictEqual(toAdd.ine_apprenant, statutsTest[0].ine_apprenant);
    assert.strictEqual(toAdd.nom_apprenant, statutsTest[0].nom_apprenant);
    assert.strictEqual(toAdd.prenom_apprenant, statutsTest[0].prenom_apprenant);
    assert.strictEqual(toAdd.prenom2_apprenant, null);
    assert.strictEqual(toAdd.prenom3_apprenant, null);
    assert.strictEqual(toAdd.ne_pas_solliciter, statutsTest[0].ne_pas_solliciter);
    assert.strictEqual(toAdd.email_contact, statutsTest[0].email_contact);
    assert.strictEqual(toAdd.nom_representant_legal, statutsTest[0].nom_representant_legal);
    assert.strictEqual(toAdd.tel_representant_legal, statutsTest[0].tel_representant_legal);
    assert.strictEqual(toAdd.tel2_representant_legal, statutsTest[0].tel2_representant_legal);
    assert.strictEqual(toAdd.id_formation, statutsTest[0].id_formation);
    assert.strictEqual(toAdd.libelle_court_formation, statutsTest[0].libelle_court_formation);
    assert.strictEqual(toAdd.libelle_long_formation, statutsTest[0].libelle_long_formation);
    assert.strictEqual(toAdd.uai_etablissement, statutsTest[0].uai_etablissement);
    assert.strictEqual(toAdd.nom_etablissement, statutsTest[0].nom_etablissement);
    assert.strictEqual(toAdd.statut_apprenant, statutsTest[0].statut_apprenant);

    // Checks exists method
    const found = await existsWithStatutValue({
      ine_apprenant: "BAD_INE",
      id_formation: toAdd.id_formation,
      uai_etablissement: toAdd.uai_etablissement,
      statut_apprenant: toAdd.statut_apprenant,
    });
    assert.strictEqual(found, false);
  });

  it("Permet de vérifier l'existence avec vérification de valeur d'un statut de candidat avec les Nom, Prénoms & Email", async () => {
    const { existsWithStatutValue } = await statutsCandidats();

    const toAdd = new StatutCandidat(statutsTest[0]);
    await toAdd.save();

    // Checks creation
    assert.strictEqual(toAdd.ine_apprenant, statutsTest[0].ine_apprenant);
    assert.strictEqual(toAdd.nom_apprenant, statutsTest[0].nom_apprenant);
    assert.strictEqual(toAdd.prenom_apprenant, statutsTest[0].prenom_apprenant);
    assert.strictEqual(toAdd.prenom2_apprenant, null);
    assert.strictEqual(toAdd.prenom3_apprenant, null);
    assert.strictEqual(toAdd.ne_pas_solliciter, statutsTest[0].ne_pas_solliciter);
    assert.strictEqual(toAdd.email_contact, statutsTest[0].email_contact);
    assert.strictEqual(toAdd.nom_representant_legal, statutsTest[0].nom_representant_legal);
    assert.strictEqual(toAdd.tel_representant_legal, statutsTest[0].tel_representant_legal);
    assert.strictEqual(toAdd.tel2_representant_legal, statutsTest[0].tel2_representant_legal);
    assert.strictEqual(toAdd.id_formation, statutsTest[0].id_formation);
    assert.strictEqual(toAdd.libelle_court_formation, statutsTest[0].libelle_court_formation);
    assert.strictEqual(toAdd.libelle_long_formation, statutsTest[0].libelle_long_formation);
    assert.strictEqual(toAdd.uai_etablissement, statutsTest[0].uai_etablissement);
    assert.strictEqual(toAdd.nom_etablissement, statutsTest[0].nom_etablissement);
    assert.strictEqual(toAdd.statut_apprenant, statutsTest[0].statut_apprenant);

    // Checks exists method
    const found = await existsWithStatutValue({
      nom_apprenant: toAdd.nom_apprenant,
      prenom_apprenant: toAdd.prenom_apprenant,
      prenom2_apprenant: toAdd.prenom2_apprenant,
      prenom3_apprenant: toAdd.prenom3_apprenant,
      email_contact: toAdd.email_contact,

      id_formation: toAdd.id_formation,
      uai_etablissement: toAdd.uai_etablissement,
      statut_apprenant: toAdd.statut_apprenant,
    });
    assert.strictEqual(found, true);
  });

  it("Permet de vérifier l'existence avec vérification de valeur d'un statut de candidat avec les mauvais Nom, Prénoms & Email", async () => {
    const { existsWithStatutValue } = await statutsCandidats();

    const toAdd = new StatutCandidat(statutsTest[0]);
    await toAdd.save();

    // Checks creation
    assert.strictEqual(toAdd.ine_apprenant, statutsTest[0].ine_apprenant);
    assert.strictEqual(toAdd.nom_apprenant, statutsTest[0].nom_apprenant);
    assert.strictEqual(toAdd.prenom_apprenant, statutsTest[0].prenom_apprenant);
    assert.strictEqual(toAdd.prenom2_apprenant, null);
    assert.strictEqual(toAdd.prenom3_apprenant, null);
    assert.strictEqual(toAdd.ne_pas_solliciter, statutsTest[0].ne_pas_solliciter);
    assert.strictEqual(toAdd.email_contact, statutsTest[0].email_contact);
    assert.strictEqual(toAdd.nom_representant_legal, statutsTest[0].nom_representant_legal);
    assert.strictEqual(toAdd.tel_representant_legal, statutsTest[0].tel_representant_legal);
    assert.strictEqual(toAdd.tel2_representant_legal, statutsTest[0].tel2_representant_legal);
    assert.strictEqual(toAdd.id_formation, statutsTest[0].id_formation);
    assert.strictEqual(toAdd.libelle_court_formation, statutsTest[0].libelle_court_formation);
    assert.strictEqual(toAdd.libelle_long_formation, statutsTest[0].libelle_long_formation);
    assert.strictEqual(toAdd.uai_etablissement, statutsTest[0].uai_etablissement);
    assert.strictEqual(toAdd.nom_etablissement, statutsTest[0].nom_etablissement);
    assert.strictEqual(toAdd.statut_apprenant, statutsTest[0].statut_apprenant);

    // Checks exists method
    const found = await existsWithStatutValue({
      nom_apprenant: "BAD_NAME",
      prenom_apprenant: toAdd.prenom_apprenant,
      prenom2_apprenant: toAdd.prenom2_apprenant,
      prenom3_apprenant: toAdd.prenom3_apprenant,
      email_contact: toAdd.email_contact,

      id_formation: toAdd.id_formation,
      uai_etablissement: toAdd.uai_etablissement,
      statut_apprenant: toAdd.statut_apprenant,
    });
    assert.strictEqual(found, false);
  });

  it("Permet de vérifier l'existence avec vérification de valeur d'un mauvais statut de candidat", async () => {
    const { existsWithStatutValue } = await statutsCandidats();

    const toAdd = new StatutCandidat(statutsTest[0]);
    await toAdd.save();

    // Checks creation
    assert.strictEqual(toAdd.ine_apprenant, statutsTest[0].ine_apprenant);
    assert.strictEqual(toAdd.nom_apprenant, statutsTest[0].nom_apprenant);
    assert.strictEqual(toAdd.prenom_apprenant, statutsTest[0].prenom_apprenant);
    assert.strictEqual(toAdd.prenom2_apprenant, null);
    assert.strictEqual(toAdd.prenom3_apprenant, null);
    assert.strictEqual(toAdd.ne_pas_solliciter, statutsTest[0].ne_pas_solliciter);
    assert.strictEqual(toAdd.email_contact, statutsTest[0].email_contact);
    assert.strictEqual(toAdd.nom_representant_legal, statutsTest[0].nom_representant_legal);
    assert.strictEqual(toAdd.tel_representant_legal, statutsTest[0].tel_representant_legal);
    assert.strictEqual(toAdd.tel2_representant_legal, statutsTest[0].tel2_representant_legal);
    assert.strictEqual(toAdd.id_formation, statutsTest[0].id_formation);
    assert.strictEqual(toAdd.libelle_court_formation, statutsTest[0].libelle_court_formation);
    assert.strictEqual(toAdd.libelle_long_formation, statutsTest[0].libelle_long_formation);
    assert.strictEqual(toAdd.uai_etablissement, statutsTest[0].uai_etablissement);
    assert.strictEqual(toAdd.nom_etablissement, statutsTest[0].nom_etablissement);
    assert.strictEqual(toAdd.statut_apprenant, statutsTest[0].statut_apprenant);

    // Checks exists method
    const found = await existsWithStatutValue({
      ine_apprenant: toAdd.ine_apprenant,
      id_formation: toAdd.id_formation,
      uai_etablissement: toAdd.uai_etablissement,
      statut_apprenant: "8",
    });
    assert.strictEqual(found, false);
  });

  it("Permet de vérifier la récupération d'un statut sur l'INE", async () => {
    const { getStatut } = await statutsCandidats();

    const toAdd = new StatutCandidat(statutsTest[0]);
    await toAdd.save();

    // Checks creation
    assert.strictEqual(toAdd.ine_apprenant, statutsTest[0].ine_apprenant);
    assert.strictEqual(toAdd.nom_apprenant, statutsTest[0].nom_apprenant);
    assert.strictEqual(toAdd.prenom_apprenant, statutsTest[0].prenom_apprenant);
    assert.strictEqual(toAdd.prenom2_apprenant, null);
    assert.strictEqual(toAdd.prenom3_apprenant, null);
    assert.strictEqual(toAdd.ne_pas_solliciter, statutsTest[0].ne_pas_solliciter);
    assert.strictEqual(toAdd.email_contact, statutsTest[0].email_contact);
    assert.strictEqual(toAdd.nom_representant_legal, statutsTest[0].nom_representant_legal);
    assert.strictEqual(toAdd.tel_representant_legal, statutsTest[0].tel_representant_legal);
    assert.strictEqual(toAdd.tel2_representant_legal, statutsTest[0].tel2_representant_legal);
    assert.strictEqual(toAdd.id_formation, statutsTest[0].id_formation);
    assert.strictEqual(toAdd.libelle_court_formation, statutsTest[0].libelle_court_formation);
    assert.strictEqual(toAdd.libelle_long_formation, statutsTest[0].libelle_long_formation);
    assert.strictEqual(toAdd.uai_etablissement, statutsTest[0].uai_etablissement);
    assert.strictEqual(toAdd.nom_etablissement, statutsTest[0].nom_etablissement);
    assert.strictEqual(toAdd.statut_apprenant, statutsTest[0].statut_apprenant);

    // Checks exists method
    const found = await getStatut({
      ine_apprenant: toAdd.ine_apprenant,
      id_formation: toAdd.id_formation,
      uai_etablissement: toAdd.uai_etablissement,
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
    assert.strictEqual(found.nom_etablissement, statutsTest[0].nom_etablissement);
    assert.strictEqual(found.statut_apprenant, statutsTest[0].statut_apprenant);
  });

  it("Permet de vérifier la récupération d'un statut sur les Nom, Prénoms & Email", async () => {
    const { getStatut } = await statutsCandidats();

    const toAdd = new StatutCandidat(statutsTest[0]);
    await toAdd.save();

    // Checks creation
    assert.strictEqual(toAdd.ine_apprenant, statutsTest[0].ine_apprenant);
    assert.strictEqual(toAdd.nom_apprenant, statutsTest[0].nom_apprenant);
    assert.strictEqual(toAdd.prenom_apprenant, statutsTest[0].prenom_apprenant);
    assert.strictEqual(toAdd.prenom2_apprenant, null);
    assert.strictEqual(toAdd.prenom3_apprenant, null);
    assert.strictEqual(toAdd.ne_pas_solliciter, statutsTest[0].ne_pas_solliciter);
    assert.strictEqual(toAdd.email_contact, statutsTest[0].email_contact);
    assert.strictEqual(toAdd.nom_representant_legal, statutsTest[0].nom_representant_legal);
    assert.strictEqual(toAdd.tel_representant_legal, statutsTest[0].tel_representant_legal);
    assert.strictEqual(toAdd.tel2_representant_legal, statutsTest[0].tel2_representant_legal);
    assert.strictEqual(toAdd.id_formation, statutsTest[0].id_formation);
    assert.strictEqual(toAdd.libelle_court_formation, statutsTest[0].libelle_court_formation);
    assert.strictEqual(toAdd.libelle_long_formation, statutsTest[0].libelle_long_formation);
    assert.strictEqual(toAdd.uai_etablissement, statutsTest[0].uai_etablissement);
    assert.strictEqual(toAdd.nom_etablissement, statutsTest[0].nom_etablissement);
    assert.strictEqual(toAdd.statut_apprenant, statutsTest[0].statut_apprenant);

    // Checks exists method
    const found = await getStatut({
      nom_apprenant: toAdd.nom_apprenant,
      prenom_apprenant: toAdd.prenom_apprenant,
      prenom2_apprenant: toAdd.prenom2_apprenant,
      prenom3_apprenant: toAdd.prenom3_apprenant,
      email_contact: toAdd.email_contact,

      id_formation: toAdd.id_formation,
      uai_etablissement: toAdd.uai_etablissement,
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
    assert.strictEqual(found.nom_etablissement, statutsTest[0].nom_etablissement);
    assert.strictEqual(found.statut_apprenant, statutsTest[0].statut_apprenant);
  });

  it("Permet de vérifier la mauvaise récupération d'un statut sur un mauvais INE", async () => {
    const { getStatut } = await statutsCandidats();

    const toAdd = new StatutCandidat(statutsTest[0]);
    await toAdd.save();

    // Checks creation
    assert.strictEqual(toAdd.ine_apprenant, statutsTest[0].ine_apprenant);
    assert.strictEqual(toAdd.nom_apprenant, statutsTest[0].nom_apprenant);
    assert.strictEqual(toAdd.prenom_apprenant, statutsTest[0].prenom_apprenant);
    assert.strictEqual(toAdd.prenom2_apprenant, null);
    assert.strictEqual(toAdd.prenom3_apprenant, null);
    assert.strictEqual(toAdd.ne_pas_solliciter, statutsTest[0].ne_pas_solliciter);
    assert.strictEqual(toAdd.email_contact, statutsTest[0].email_contact);
    assert.strictEqual(toAdd.nom_representant_legal, statutsTest[0].nom_representant_legal);
    assert.strictEqual(toAdd.tel_representant_legal, statutsTest[0].tel_representant_legal);
    assert.strictEqual(toAdd.tel2_representant_legal, statutsTest[0].tel2_representant_legal);
    assert.strictEqual(toAdd.id_formation, statutsTest[0].id_formation);
    assert.strictEqual(toAdd.libelle_court_formation, statutsTest[0].libelle_court_formation);
    assert.strictEqual(toAdd.libelle_long_formation, statutsTest[0].libelle_long_formation);
    assert.strictEqual(toAdd.uai_etablissement, statutsTest[0].uai_etablissement);
    assert.strictEqual(toAdd.nom_etablissement, statutsTest[0].nom_etablissement);
    assert.strictEqual(toAdd.statut_apprenant, statutsTest[0].statut_apprenant);

    // Checks exists method
    const found = await getStatut({
      ine_apprenant: "BAD_INE",
      id_formation: toAdd.id_formation,
      uai_etablissement: toAdd.uai_etablissement,
    });
    assert.strictEqual(found, null);
  });

  it("Permet de vérifier la mauvaise récupération d'un statut sur mauvais Nom, Prénoms & Email", async () => {
    const { getStatut } = await statutsCandidats();

    const toAdd = new StatutCandidat(statutsTest[0]);
    await toAdd.save();

    // Checks creation
    assert.strictEqual(toAdd.ine_apprenant, statutsTest[0].ine_apprenant);
    assert.strictEqual(toAdd.nom_apprenant, statutsTest[0].nom_apprenant);
    assert.strictEqual(toAdd.prenom_apprenant, statutsTest[0].prenom_apprenant);
    assert.strictEqual(toAdd.prenom2_apprenant, null);
    assert.strictEqual(toAdd.prenom3_apprenant, null);
    assert.strictEqual(toAdd.ne_pas_solliciter, statutsTest[0].ne_pas_solliciter);
    assert.strictEqual(toAdd.email_contact, statutsTest[0].email_contact);
    assert.strictEqual(toAdd.nom_representant_legal, statutsTest[0].nom_representant_legal);
    assert.strictEqual(toAdd.tel_representant_legal, statutsTest[0].tel_representant_legal);
    assert.strictEqual(toAdd.tel2_representant_legal, statutsTest[0].tel2_representant_legal);
    assert.strictEqual(toAdd.id_formation, statutsTest[0].id_formation);
    assert.strictEqual(toAdd.libelle_court_formation, statutsTest[0].libelle_court_formation);
    assert.strictEqual(toAdd.libelle_long_formation, statutsTest[0].libelle_long_formation);
    assert.strictEqual(toAdd.uai_etablissement, statutsTest[0].uai_etablissement);
    assert.strictEqual(toAdd.nom_etablissement, statutsTest[0].nom_etablissement);
    assert.strictEqual(toAdd.statut_apprenant, statutsTest[0].statut_apprenant);

    // Checks exists method
    const found = await getStatut({
      nom_apprenant: "BAD_NAME",
      prenom_apprenant: toAdd.prenom_apprenant,
      prenom2_apprenant: toAdd.prenom2_apprenant,
      prenom3_apprenant: toAdd.prenom3_apprenant,
      email_contact: toAdd.email_contact,

      id_formation: toAdd.id_formation,
      uai_etablissement: toAdd.uai_etablissement,
    });
    assert.strictEqual(found, null);
  });

  it("Permet de vérifier l'ajout ou la mise à jour d'un statut'", async () => {
    const { addOrUpdateStatuts } = await statutsCandidats();

    // Add statuts test
    await asyncForEach(statutsTest, async (statutTest) => {
      const toAdd = new StatutCandidat(statutTest);
      await toAdd.save();
    });

    // Checks addOrUpdateStatuts method
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
    assert.strictEqual(foundAdded.statut_apprenant, statutsTestUpdate[3].statut_apprenant);
    assert.strictEqual(foundAdded.updated_at, null);

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
    assert.strictEqual(firstUpdated.nom_etablissement, statutsTestUpdate[0].nom_etablissement);
    assert.strictEqual(firstUpdated.statut_apprenant, statutsTestUpdate[0].statut_apprenant);
    assert.notDeepStrictEqual(firstUpdated.updated_at, null);

    const secondUpdated = await StatutCandidat.findById(updated[1]._id);
    assert.strictEqual(secondUpdated.ine_apprenant, statutsTestUpdate[1].ine_apprenant);
    assert.strictEqual(secondUpdated.nom_apprenant, statutsTestUpdate[1].nom_apprenant);
    assert.strictEqual(secondUpdated.prenom_apprenant, statutsTestUpdate[1].prenom_apprenant);
    assert.strictEqual(secondUpdated.ne_pas_solliciter, statutsTestUpdate[1].ne_pas_solliciter);
    assert.strictEqual(secondUpdated.email_contact, statutsTestUpdate[1].email_contact);
    assert.strictEqual(secondUpdated.id_formation, statutsTestUpdate[1].id_formation);
    assert.strictEqual(secondUpdated.uai_etablissement, statutsTestUpdate[1].uai_etablissement);
    assert.strictEqual(secondUpdated.nom_etablissement, statutsTestUpdate[1].nom_etablissement);
    assert.strictEqual(secondUpdated.statut_apprenant, statutsTestUpdate[1].statut_apprenant);
    assert.notDeepStrictEqual(secondUpdated.updated_at, null);

    const thirdUpdated = await StatutCandidat.findById(updated[2]._id);
    assert.strictEqual(thirdUpdated.nom_apprenant, statutsTestUpdate[2].nom_apprenant);
    assert.strictEqual(thirdUpdated.prenom_apprenant, statutsTestUpdate[2].prenom_apprenant);
    assert.strictEqual(thirdUpdated.ne_pas_solliciter, statutsTestUpdate[2].ne_pas_solliciter);
    assert.strictEqual(thirdUpdated.email_contact, statutsTestUpdate[2].email_contact);
    assert.strictEqual(thirdUpdated.id_formation, statutsTestUpdate[2].id_formation);
    assert.strictEqual(thirdUpdated.uai_etablissement, statutsTestUpdate[2].uai_etablissement);
    assert.strictEqual(thirdUpdated.nom_etablissement, statutsTestUpdate[2].nom_etablissement);
    assert.strictEqual(thirdUpdated.statut_apprenant, statutsTestUpdate[2].statut_apprenant);
    assert.notDeepStrictEqual(thirdUpdated.updated_at, null);
  });

  it("Permet de vérifier l'ajout ou la mise à jour d'un statut avec erreur de cohérence sur le statut", async () => {
    const { addOrUpdateStatuts } = await statutsCandidats();

    // Add statut test
    const toAdd = new StatutCandidat(simpleStatut);
    await toAdd.save();

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
    assert.strictEqual(found.statut_apprenant, simpleStatutBadUpdate.statut_apprenant);
    assert.strictEqual(found.statut_mise_a_jour_statut, codesStatutsMajStatutCandidats.ko);
    assert.notDeepStrictEqual(found.erreur_mise_a_jour_statut, null);
    assert.notDeepStrictEqual(found.updated_at, null);
  });
});
