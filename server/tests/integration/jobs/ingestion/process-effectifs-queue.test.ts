import { ObjectId } from "mongodb";

import { createOrganisme } from "@/common/actions/organismes/organismes.actions";
import { effectifsQueueDb, effectifsDb } from "@/common/model/collections";
import { processEffectifsQueue } from "@/jobs/ingestion/process-effectifs-queue";
import { sample41461021200014 } from "@tests/data/entreprise.api.gouv.fr/sampleDataApiEntreprise";
import { createRandomDossierApprenantApiInput, createRandomOrganisme } from "@tests/data/randomizedSample";

const uai = "0802004U";
const siret = "77937827200016";

const sortByPath = (array: { path?: string[] }[] | undefined) =>
  array?.sort((a, b) => ((a?.path?.[0] || "") < (b?.path?.[0] || "") ? -1 : 1));

describe("Processing de EffectifsQueue", () => {
  beforeEach(async () => {
    await createOrganisme(createRandomOrganisme({ uai, siret }));
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
      const { insertedId } = await effectifsQueueDb().insertOne({
        ...createRandomDossierApprenantApiInput({ [requiredField]: undefined }),

        created_at: new Date(),
      });
      const result = await processEffectifsQueue();

      expect(result).toStrictEqual({
        totalProcessed: 1,
        totalValidItems: 0,
        totalInvalidItems: 1,
      });

      const updatedInput = await effectifsQueueDb().findOne({ _id: insertedId });
      expect(updatedInput).toMatchObject({
        processed_at: expect.any(Date),
        validation_errors: [
          {
            message: requiredField.includes("date_") ? "Date invalide" : "String attendu",
            path: [requiredField],
          },
        ],
      });

      // check that no data was created
      expect(await effectifsDb().countDocuments({})).toBe(0);
    });
  });

  it("Vérifie qu'on ne crée pas de donnée et remonte une erreur lorsque le dossier ne respecte pas le format", async () => {
    const { insertedId } = await effectifsQueueDb().insertOne({
      ...createRandomDossierApprenantApiInput({
        annee_scolaire: "2021,2022",
        uai_etablissement: "invalideUAI",
        formation_rncp: "invalideRncp",
        siret_etablissement: "invalideSiret",
        id_formation: "invalideIdFormation",
      }),

      created_at: new Date(),
    });

    const result = await processEffectifsQueue();

    expect(result).toStrictEqual({
      totalProcessed: 1,
      totalValidItems: 0,
      totalInvalidItems: 1,
    });

    const updatedInput = await effectifsQueueDb().findOne({ _id: insertedId });

    expect(updatedInput).toMatchObject({
      processed_at: expect.any(Date),
    });

    expect(sortByPath(updatedInput?.validation_errors)).toStrictEqual([
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
    expect(await effectifsDb().countDocuments({})).toBe(0);
  });

  it("Vérifie qu'on ne crée pas de donnée et renvoie une erreur lorsque les champs date ne sont pas iso", async () => {
    const { insertedId } = await effectifsQueueDb().insertOne({
      ...createRandomDossierApprenantApiInput({
        date_metier_mise_a_jour_statut: "2020",
        date_de_naissance_apprenant: "2020-10",
        contrat_date_debut: "13/11/2020",
        contrat_date_fin: "abc",
        contrat_date_rupture: "13/11/2020",
      }),

      created_at: new Date(),
    });
    const result = await processEffectifsQueue();

    expect(result).toStrictEqual({
      totalProcessed: 1,
      totalValidItems: 0,
      totalInvalidItems: 1,
    });

    const updatedInput = await effectifsQueueDb().findOne({ _id: insertedId });

    expect(sortByPath(updatedInput?.validation_errors)).toMatchObject([
      {
        message: "Date invalide",
        path: ["contrat_date_debut"],
      },
      {
        message: "Date invalide",
        path: ["contrat_date_fin"],
      },
      {
        message: "Date invalide",
        path: ["contrat_date_rupture"],
      },
      {
        message: "Date invalide",
        path: ["date_de_naissance_apprenant"],
      },
      {
        message: "Date invalide",
        path: ["date_metier_mise_a_jour_statut"],
      },
    ]);

    // check that no data was created
    expect(await effectifsDb().countDocuments({})).toBe(0);
  });

  it("Vérifie qu'on ne crée pas de donnée et renvoie une erreur lorsque les données UAI / SIRET sont invalides", async () => {
    const { insertedId } = await effectifsQueueDb().insertOne({
      ...createRandomDossierApprenantApiInput({
        uai_etablissement: uai,
        siret_etablissement: sample41461021200014.etablissement.siret,
      }),

      created_at: new Date(),
    });

    const result = await processEffectifsQueue();

    expect(result).toStrictEqual({
      totalProcessed: 1,
      totalValidItems: 0,
      totalInvalidItems: 1,
    });

    const updatedInput = await effectifsQueueDb().findOne({ _id: insertedId });

    expect(updatedInput).toMatchObject({
      error:
        "L'organisme ayant l'UAI 0802004U existe déja en base avec un SIRET différent : 77937827200016 (reçu 41461021200014)",
      processed_at: expect.any(Date),
    });

    // check that no data was created
    expect(await effectifsDb().countDocuments({})).toBe(0);
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
      source: "apiUser",
      created_at: new Date(),
    };

    const { insertedId } = await effectifsQueueDb().insertOne(sampleData);
    const result = await processEffectifsQueue();
    const updatedInput = await effectifsQueueDb().findOne({ _id: insertedId });

    expect(updatedInput?.error).toBeUndefined();
    expect(updatedInput?.validation_errors).toBeUndefined();
    expect(updatedInput?.processed_at).toBeInstanceOf(Date);

    expect(result).toStrictEqual({
      totalProcessed: 1,
      totalValidItems: 1,
      totalInvalidItems: 0,
    });

    // Check Nb Items added
    expect(await effectifsQueueDb().countDocuments({})).toBe(1);
  });

  it("Vérifie que la donnée est bien trimmée", async () => {
    const sampleData = {
      ine_apprenant: "402957826QH",
      nom_apprenant: "  fleury  ",
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
      source: "apiUser",
      created_at: new Date(),
    };

    const { insertedId } = await effectifsQueueDb().insertOne(sampleData);
    const result = await processEffectifsQueue();

    const updatedInput = await effectifsQueueDb().findOne({ _id: insertedId });

    expect(updatedInput?.error).toBeUndefined();
    expect(updatedInput?.validation_errors).toBeUndefined();
    expect(updatedInput?.processed_at).toBeInstanceOf(Date);

    expect(result).toStrictEqual({
      totalProcessed: 1,
      totalValidItems: 1,
      totalInvalidItems: 0,
    });

    // Check Nb Items added
    expect(await effectifsDb().countDocuments({})).toBe(1);

    const insertedDossier = await effectifsDb().findOne({});

    expect(insertedDossier).toStrictEqual({
      source: "apiUser",
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
        telephone: "+33534648662",
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
        annee: 0,
        periode: [2022, 2024],
        libelle_long: "TECHNICIEN D'ETUDES DU BATIMENT OPTION A : ETUDES ET ECONOMIE (BAC PRO)",
      },
      id_erp_apprenant: "9a890d67-e233-46d5-8611-06d6648e7611",
      is_lock: {
        apprenant: {
          ine: true,
          nom: true,
          prenom: true,
          date_de_naissance: true,
          courriel: true,
          telephone: true,
          adresse: {
            code_postal: true,
            code_insee: true,
            commune: true,
            departement: true,
            region: true,
            academie: true,
          },
          historique_statut: true,
        },
        contrats: true,
        formation: {
          cfd: true,
          libelle_long: true,
          periode: true,
          annee: true,
        },
      },
      validation_errors: [],

      annee_scolaire: "2024-2025",
      // other added fields
      _id: expect.anything(),
      created_at: expect.any(Date),
      updated_at: expect.any(Date),
      organisme_id: expect.any(ObjectId),
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
