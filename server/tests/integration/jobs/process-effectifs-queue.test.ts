import { strict as assert } from "assert";

import { createRandomDossierApprenantApiInput, createRandomOrganisme } from "../../data/randomizedSample.js";
import { createOrganisme } from "../../../src/common/actions/organismes/organismes.actions.js";
import { processEffectifsQueue } from "../../../src/jobs/fiabilisation/dossiersApprenants/process-effectifs-queue.js";
import { dossiersApprenantsMigrationDb, effectifsQueueDb } from "../../../src/common/model/collections.js";

const uai = "0802004U";
const siret = "77937827200016";

describe("Processing de EffectifsQueue", () => {
  beforeEach(async () => {
    await createOrganisme(createRandomOrganisme({ uai, siret }), {
      buildFormationTree: false,
      buildInfosFromSiret: false,
      callLbaApi: false,
    });
  });

  const requiredFields = [
    "prenom_apprenant",
    "nom_apprenant",
    "date_de_naissance_apprenant",
    "id_formation",
    "uai_etablissement",
    "annee_scolaire",
    "date_metier_mise_a_jour_statut",
    "id_erp_apprenant",
  ];
  requiredFields.forEach((requiredField) => {
    it(`Vérifie qu'on ne crée pas de donnée et remonte une erreur lorsque le champ obligatoire '${requiredField}' n'est pas renseigné`, async () => {
      // set required field as undefined
      const { insertedId } = await effectifsQueueDb().insertOne(
        createRandomDossierApprenantApiInput({ [requiredField]: undefined, source: "testSource" })
      );
      await processEffectifsQueue();
      const updatedInput = await effectifsQueueDb().findOne({ _id: insertedId });

      assert.deepStrictEqual(updatedInput?.validation_errors, [
        {
          message: `"${requiredField}" must be a string`,
          path: [requiredField],
        },
      ]);

      // check that no data was created
      assert.equal(await dossiersApprenantsMigrationDb().countDocuments({}), 0);
    });
  });

  it("Vérifie qu'on ne crée pas de donnée et remonte une erreur lorsque le dossier ne respecte pas le format", async () => {
    const { insertedId } = await effectifsQueueDb().insertOne(
      createRandomDossierApprenantApiInput({
        annee_scolaire: "2021,2022",
        uai_etablissement: "invalideUAI",
        siret_etablissement: "invalideSiret",
        id_formation: "invalideIdFormation",
        source: "testSource",
      })
    );
    await processEffectifsQueue();
    const updatedInput = await effectifsQueueDb().findOne({ _id: insertedId });
    assert.deepStrictEqual(updatedInput?.validation_errors, [
      {
        message:
          '"uai_etablissement" with value "invalideUAI" fails to match the required pattern: /^[0-9]{7}[a-zA-Z]$/',
        path: ["uai_etablissement"],
      },
      {
        message:
          '"id_formation" with value "invalideIdFormation" fails to match the required pattern: /^[a-zA-Z0-9_]{8}$/',
        path: ["id_formation"],
      },
      {
        message: '"annee_scolaire" with value "2021,2022" fails to match the required pattern: /^\\d{4}-\\d{4}$/',
        path: ["annee_scolaire"],
      },
      {
        message: '"siret_etablissement" length must be 14 characters long',
        path: ["siret_etablissement"],
      },
      {
        message: '"siret_etablissement" with value "invalideSiret" fails to match the required pattern: /^[0-9]{14}$/',
        path: ["siret_etablissement"],
      },
    ]);

    // check that no data was created
    assert.equal(await dossiersApprenantsMigrationDb().countDocuments({}), 0);
  });

  it(`Vérifie qu'on ne crée pas de donnée et renvoie une erreur lorsque les champs date ne sont pas iso`, async () => {
    const { insertedId } = await effectifsQueueDb().insertOne(
      createRandomDossierApprenantApiInput({
        date_metier_mise_a_jour_statut: "2020",
        date_de_naissance_apprenant: "2020-10",
        contrat_date_debut: "13/11/2020",
        contrat_date_fin: "abc",
        contrat_date_rupture: true,
        source: "testSource",
      })
    );
    await processEffectifsQueue();
    const updatedInput = await effectifsQueueDb().findOne({ _id: insertedId });
    assert.deepStrictEqual(updatedInput?.validation_errors, [
      {
        message:
          '"date_de_naissance_apprenant" with value "2020-10" fails to match the required pattern: /^([0-9]{4})-([0-9]{2})-([0-9]{2})/',
        path: ["date_de_naissance_apprenant"],
      },
      {
        message:
          '"date_metier_mise_a_jour_statut" with value "2020" fails to match the required pattern: /^([0-9]{4})-([0-9]{2})-([0-9]{2})/',
        path: ["date_metier_mise_a_jour_statut"],
      },
      {
        message:
          '"contrat_date_debut" with value "13/11/2020" fails to match the required pattern: /^([0-9]{4})-([0-9]{2})-([0-9]{2})/',
        path: ["contrat_date_debut"],
      },
      {
        message: '"contrat_date_debut" must be in iso format',
        path: ["contrat_date_debut"],
      },
      {
        message:
          '"contrat_date_fin" with value "abc" fails to match the required pattern: /^([0-9]{4})-([0-9]{2})-([0-9]{2})/',
        path: ["contrat_date_fin"],
      },
      {
        message: '"contrat_date_fin" must be in iso format',
        path: ["contrat_date_fin"],
      },
      {
        message: '"contrat_date_rupture" must be a string',
        path: ["contrat_date_rupture"],
      },
    ]);

    // check that no data was created
    assert.equal(await dossiersApprenantsMigrationDb().countDocuments({}), 0);
  });

  it("Vérifie l'ajout avec de la donnée valide", async () => {
    const sampleData = {
      ine_apprenant: "402957826QH",
      nom_apprenant: "FLEURY",
      prenom_apprenant: "Fortuné",
      date_de_naissance_apprenant: "1999-08-31T16:21:32",
      email_contact: "Clandre34@hotmail.fr",
      id_formation: "50033610",
      libelle_long_formation: "TECHNICIEN D'ETUDES DU BATIMENT OPTION A : ETUDES ET ECONOMIE (BAC PRO)",
      uai_etablissement: uai,
      siret_etablissement: siret,
      nom_etablissement: "ETABLISSEMENT EMPOWER",
      statut_apprenant: 3,
      date_metier_mise_a_jour_statut: "2022-12-28T04:05:47.647Z",
      annee_formation: 0,
      periode_formation: "2022-2024",
      annee_scolaire: "2024-2025",
      id_erp_apprenant: "9a890d67-e233-46d5-8611-06d6648e7611",
      tel_apprenant: "+33 534648662",
      code_commune_insee_apprenant: "05109",
      source: "testSource",
    };

    await effectifsQueueDb().insertOne(sampleData);
    await processEffectifsQueue();

    // Check Nb Items added
    assert.deepEqual(await dossiersApprenantsMigrationDb().countDocuments({}), 1);
  });

  it("Vérifie que la donnée est bien trimmée", async () => {
    const sampleData = {
      ine_apprenant: "402957826QH",
      nom_apprenant: "  FLEURY  ",
      prenom_apprenant: "   Fortuné  ",
      date_de_naissance_apprenant: "1999-08-31T16:21:32",
      email_contact: "Clandre34@hotmail.fr",
      id_formation: "50033610",
      libelle_long_formation: "TECHNICIEN D'ETUDES DU BATIMENT OPTION A : ETUDES ET ECONOMIE (BAC PRO)",
      uai_etablissement: uai,
      siret_etablissement: siret,
      nom_etablissement: "ETABLISSEMENT EMPOWER",
      statut_apprenant: 3,
      date_metier_mise_a_jour_statut: "2022-12-28T04:05:47.647Z",
      annee_formation: 0,
      periode_formation: "2022-2024",
      annee_scolaire: "2024-2025",
      id_erp_apprenant: "9a890d67-e233-46d5-8611-06d6648e7611",
      tel_apprenant: "+33 534648662",
      code_commune_insee_apprenant: "05109",
      source: "testSource",
    };

    const { insertedId } = await effectifsQueueDb().insertOne(sampleData);
    await processEffectifsQueue();
    const updatedInput = await effectifsQueueDb().findOne({ _id: insertedId });

    assert.equal(updatedInput?.validation_errors, undefined);
    assert.equal(!!updatedInput?.processed_at, true);

    // Check Nb Items added
    assert.deepEqual(await dossiersApprenantsMigrationDb().countDocuments({}), 1);

    const insertedDossier = await dossiersApprenantsMigrationDb().findOne({});

    assert(insertedDossier);
    assert.deepStrictEqual(insertedDossier, {
      ine_apprenant: "402957826QH",
      nom_apprenant: "FLEURY",
      prenom_apprenant: "FORTUNÉ",
      date_de_naissance_apprenant: new Date("1999-08-31T16:21:32"),
      email_contact: "Clandre34@hotmail.fr",
      id_formation: "50033610",
      libelle_long_formation: "TECHNICIEN D'ETUDES DU BATIMENT OPTION A : ETUDES ET ECONOMIE (BAC PRO)",
      uai_etablissement: uai,
      siret_etablissement: siret,
      nom_etablissement: "ETABLISSEMENT EMPOWER",
      statut_apprenant: 3,
      date_metier_mise_a_jour_statut: new Date("2022-12-28T04:05:47.647Z"),
      annee_formation: 0,
      periode_formation: [2022, 2024],
      annee_scolaire: "2024-2025",
      id_erp_apprenant: "9a890d67-e233-46d5-8611-06d6648e7611",
      tel_apprenant: "+33 534648662",
      code_commune_insee_apprenant: "05109",
      source: "testSource",
      // other added fields
      _id: insertedDossier._id,
      created_at: insertedDossier.created_at || "shouldnotbeempty",
      updated_at: insertedDossier.updated_at || "shouldnotbeempty",
      organisme_id: insertedDossier.organisme_id || "shouldnotbeempty",
      etablissement_reseaux: [],
      formation_cfd: "50033610",
      historique_statut_apprenant: [
        {
          date_reception: insertedDossier.historique_statut_apprenant[0].date_reception || "shouldnotbeempty",
          date_statut: new Date("2022-12-28T04:05:47.647Z"),
          valeur_statut: 3,
        },
      ],
    });
  });
});
