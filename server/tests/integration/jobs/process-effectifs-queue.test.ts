import { strict as assert } from "assert";

import { createOrganisme } from "@/common/actions/organismes/organismes.actions";
import { effectifsQueueDb, effectifsDb } from "@/common/model/collections";
import { processEffectifsQueue } from "@/jobs/fiabilisation/dossiersApprenants/process-effectifs-queue";
import { createRandomDossierApprenantApiInput, createRandomOrganisme } from "@tests/data/randomizedSample";

const uai = "0802004U";
const siret = "77937827200016";

const sortByPath = (array: { path?: string[] }[] | undefined) =>
  array?.sort((a, b) => ((a?.path?.[0] || "") < (b?.path?.[0] || "") ? -1 : 1));

describe("Processing de EffectifsQueue", () => {
  beforeEach(async () => {
    try {
      await createOrganisme(createRandomOrganisme({ uai, siret }), {
        buildFormationTree: false,
        buildInfosFromSiret: false,
        callLbaApi: false,
      });
    } catch (e) {
      console.error("Oups", e);
      throw e;
    }
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
  requiredFields.forEach(async (requiredField) => {
    it(`Vérifie qu'on ne crée pas de donnée et remonte une erreur lorsque le champ obligatoire '${requiredField}' n'est pas renseigné`, async () => {
      // set required field as undefined
      const { insertedId } = await effectifsQueueDb().insertOne(
        createRandomDossierApprenantApiInput({ [requiredField]: undefined, source: "testSource" })
      );
      const result = await processEffectifsQueue();
      assert.deepStrictEqual(result, {
        totalProcessed: 1,
        totalValidItems: 0,
        totalInvalidItems: 1,
      });

      const updatedInput = await effectifsQueueDb().findOne({ _id: insertedId });
      expect(sortByPath(updatedInput?.validation_errors)).toMatchObject([
        {
          message: "String attendu",
          path: [requiredField],
        },
      ]);

      // check that no data was created
      assert.equal(await effectifsDb().countDocuments({}), 0);
    });
  });

  it("Vérifie qu'on ne crée pas de donnée et remonte une erreur lorsque le dossier ne respecte pas le format", async () => {
    const { insertedId } = await effectifsQueueDb().insertOne(
      createRandomDossierApprenantApiInput({
        annee_scolaire: "2021,2022",
        uai_etablissement: "invalideUAI",
        formation_rncp: "invalideRncp",
        siret_etablissement: "invalideSiret",
        id_formation: "invalideIdFormation",
        source: "testSource",
      })
    );

    const result = await processEffectifsQueue();
    assert.deepStrictEqual(result, {
      totalProcessed: 1,
      totalValidItems: 0,
      totalInvalidItems: 1,
    });

    const updatedInput = await effectifsQueueDb().findOne({ _id: insertedId });

    assert.deepStrictEqual(sortByPath(updatedInput?.validation_errors), [
      {
        message: "Format invalide",
        path: ["annee_scolaire"],
      },
      {
        message: "Code RNCP invalide",
        path: ["formation_rncp"],
      },
      {
        message: "Code CFD invalide",
        path: ["id_formation"],
      },
      {
        message: "SIRET invalide",
        path: ["siret_etablissement"],
      },
      {
        message: "UAI invalide",
        path: ["uai_etablissement"],
      },
    ]);

    // check that no data was created
    assert.equal(await effectifsDb().countDocuments({}), 0);
  });

  it(`Vérifie qu'on ne crée pas de donnée et renvoie une erreur lorsque les champs date ne sont pas iso`, async () => {
    const { insertedId } = await effectifsQueueDb().insertOne(
      createRandomDossierApprenantApiInput({
        date_metier_mise_a_jour_statut: "2020",
        date_de_naissance_apprenant: "2020-10",
        contrat_date_debut: "13/11/2020",
        contrat_date_fin: "abc",
        contrat_date_rupture: "13/11/2020",
        source: "testSource",
      })
    );
    const result = await processEffectifsQueue();
    assert.deepStrictEqual(result, {
      totalProcessed: 1,
      totalValidItems: 0,
      totalInvalidItems: 1,
    });

    const updatedInput = await effectifsQueueDb().findOne({ _id: insertedId });

    expect(sortByPath(updatedInput?.validation_errors)).toMatchObject([
      {
        message: "Format invalide",
        path: ["contrat_date_debut"],
      },
      {
        message: "Format invalide",
        path: ["contrat_date_fin"],
      },
      {
        message: "Format invalide",
        path: ["contrat_date_rupture"],
      },
      {
        message: "Format invalide",
        path: ["date_de_naissance_apprenant"],
      },
      {
        message: "Format invalide",
        path: ["date_metier_mise_a_jour_statut"],
      },
    ]);

    // check that no data was created
    assert.equal(await effectifsDb().countDocuments({}), 0);
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
    const result = await processEffectifsQueue();
    assert.deepStrictEqual(result, {
      totalProcessed: 1,
      totalValidItems: 1,
      totalInvalidItems: 0,
    });

    // Check Nb Items added
    assert.deepEqual(await effectifsQueueDb().countDocuments({}), 1);
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
    const result = await processEffectifsQueue();
    assert.deepStrictEqual(result, {
      totalProcessed: 1,
      totalValidItems: 1,
      totalInvalidItems: 0,
    });

    const updatedInput = await effectifsQueueDb().findOne({ _id: insertedId });

    assert.equal(updatedInput?.validation_errors, undefined);
    assert.equal(updatedInput?.error, undefined);
    assert.equal(!!updatedInput?.processed_at, true);

    // Check Nb Items added
    assert.deepEqual(await effectifsDb().countDocuments({}), 1);

    const insertedDossier = await effectifsDb().findOne({});

    assert(insertedDossier);

    expect(insertedDossier).toStrictEqual({
      apprenant: {
        nom: "FLEURY",
        prenom: "Fortuné",
        historique_statut: [
          {
            valeur_statut: 3,
            date_statut: new Date("2022-12-28T04:05:47.647Z"),
            date_reception: expect.anything(),
          },
        ],
        ine: "402957826QH",
        date_de_naissance: new Date("1999-08-31T16:21:32"),
        courriel: "Clandre34@hotmail.fr",
        adresse: {
          code_insee: "05109",
          code_postal: "05109",
          commune: "[NOM_DE_LA_COMMUNE]",
          departement: "05",
          academie: "2",
          region: "93",
        },
      },
      contrats: [],
      formation: {
        cfd: "50033610",
        annee: "0",
        periode: [2022, 2024],
        libelle_long: "TECHNICIEN D'ETUDES DU BATIMENT OPTION A : ETUDES ET ECONOMIE (BAC PRO)",
      },
      id_erp_apprenant: "9a890d67-e233-46d5-8611-06d6648e7611",
      is_lock: {
        apprenant: {
          ine: true,
          nom: true,
          prenom: true,
          sexe: false,
          date_de_naissance: true,
          nationalite: false,
          handicap: false,
          courriel: true,
          telephone: false,
          adresse: {
            numero: false,
            repetition_voie: false,
            voie: false,
            complement: false,
            code_postal: true,
            code_insee: true,
            commune: true,
            departement: true,
            region: true,
            academie: true,
            complete: false,
            pays: false,
          },
          historique_statut: true,
          code_postal_de_naissance: false,
          regime_scolaire: false,
          inscription_sportif_haut_niveau: false,
          situation_avant_contrat: false,
          derniere_situation: false,
          dernier_organisme_uai: false,
          organisme_gestionnaire: false,
          dernier_diplome: false,
          mineur_emancipe: false,
          representant_legal: {
            nom: false,
            prenom: false,
            pcs: false,
            meme_adresse: false,
            adresse: {
              numero: false,
              repetition_voie: false,
              voie: false,
              complement: false,
              code_postal: false,
              code_insee: false,
              commune: false,
              departement: false,
              region: false,
              academie: false,
              complete: false,
              pays: false,
            },
            courriel: false,
            telephone: false,
          },
        },
        contrats: true,
        formation: {
          cfd: true,
          rncp: false,
          libelle_long: true,
          niveau: false,
          niveau_libelle: false,
          periode: true,
          annee: true,
          date_debut_formation: false,
          date_fin_formation: false,
          date_obtention_diplome: false,
          duree_formation_relle: false,
        },
      },
      validation_errors: [],
      source: "testSource",
      annee_scolaire: "2024-2025",
      // other added fields
      _id: insertedDossier._id,
      created_at: insertedDossier.created_at || "shouldnotbeempty",
      updated_at: insertedDossier.updated_at || "shouldnotbeempty",
      organisme_id: insertedDossier.organisme_id || "shouldnotbeempty",
      _computed: {
        organisme: {
          academie: "10",
          departement: "01",
          region: "84",
          reseaux: [],
          siret: "77937827200016",
          uai: "0802004U",
        },
      },
    });
  });
});
