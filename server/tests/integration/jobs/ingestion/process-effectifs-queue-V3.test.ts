import set from "lodash-es/set";
import { ObjectId } from "mongodb";

import { createOrganisme } from "@/common/actions/organismes/organismes.actions";
import { effectifsDb, effectifsV3QueueDb } from "@/common/model/collections";
import { processEffectifsQueue } from "@/jobs/ingestion/process-ingestion";
import { createRandomDossierApprenantApiV3Input, createRandomOrganisme } from "@tests/data/randomizedSample";

const uai = "0802004U";
const siret = "77937827200016";

describe("Processing de EffectifsQueueV3", () => {
  beforeEach(async () => {
    try {
      await createOrganisme(createRandomOrganisme({ uai, siret }));
    } catch (e) {
      console.error("Oups", e);
      throw e;
    }
  });

  const requiredFields = [
    "apprenant.prenom",
    "apprenant.nom",
    "apprenant.date_de_naissance",
    "apprenant.date_metier_mise_a_jour_statut",
    "formation.annee_scolaire",
    "formation.date_inscription",
    "formation.date_entree",
    "formation.date_fin",
    "apprenant.id_erp",
  ];

  requiredFields.forEach(async (requiredField) => {
    it(`Vérifie qu'on ne crée pas de donnée et remonte une erreur lorsque le champ obligatoire '${requiredField}' n'est pas renseigné`, async () => {
      // set required field as undefined
      const { insertedId } = await effectifsV3QueueDb().insertOne({
        ...(createRandomDossierApprenantApiV3Input(set({}, requiredField, undefined)) as any),
        created_at: new Date(),
      });
      const result = await processEffectifsQueue({ v3: true });
      expect(result).toStrictEqual({
        totalProcessed: 1,
        totalValidItems: 0,
        totalInvalidItems: 1,
      });

      const updatedInput = await effectifsV3QueueDb().findOne({ _id: insertedId });
      expect(updatedInput?.validation_errors).toMatchObject([
        {
          message: requiredField.includes("date_") ? "Champ obligatoire" : "String attendu",
          path: requiredField.split("."),
        },
      ]);

      // check that no data was created
      expect(await effectifsDb().countDocuments({})).toBe(0);
    });
  });

  it("Vérifie qu'on ne crée pas de donnée et remonte une erreur lorsque le dossier ne respecte pas le format", async () => {
    const { insertedId } = await effectifsV3QueueDb().insertOne({
      ...(createRandomDossierApprenantApiV3Input({
        formation: {
          annee_scolaire: "2021,2022",
          code_cfd: "invalideIdFormation",
          code_rncp: "invalideRncp",
        },
        etablissement_formateur: {
          siret: "invalideSiret",
          uai: "invalideUAI",
        },
      }) as any),

      created_at: new Date(),
    });

    expect(await processEffectifsQueue({ v3: true })).toStrictEqual({
      totalProcessed: 1,
      totalValidItems: 0,
      totalInvalidItems: 1,
    });

    const updatedInput = await effectifsV3QueueDb().findOne({ _id: insertedId });

    expect(updatedInput?.validation_errors).toEqual([
      {
        message: "SIRET invalide",
        path: ["etablissement_formateur", "siret"],
      },
      {
        message: "UAI invalide",
        path: ["etablissement_formateur", "uai"],
      },
      {
        message: "Format invalide",
        path: ["formation", "annee_scolaire"],
      },
      {
        message: "Code CFD invalide",
        path: ["formation", "code_cfd"],
      },
      {
        message: "Code RNCP invalide",
        path: ["formation", "code_rncp"],
      },
    ]);

    // check that no data was created
    expect(await effectifsDb().countDocuments({})).toBe(0);
  });

  it(`Vérifie qu'on ne crée pas de donnée et renvoie une erreur lorsque les champs date ne sont pas iso`, async () => {
    const { insertedId } = await effectifsV3QueueDb().insertOne({
      ...(createRandomDossierApprenantApiV3Input({
        apprenant: {
          date_de_naissance: "2020-10",
          date_metier_mise_a_jour_statut: "2020",
        },
        contrat: {
          date_debut: "13/11/2020",
          date_fin: "abc",
          date_rupture: "13/11/2020",
        },
      }) as any),

      created_at: new Date(),
    });
    const result = await processEffectifsQueue({ v3: true });
    expect(result).toStrictEqual({
      totalProcessed: 1,
      totalValidItems: 0,
      totalInvalidItems: 1,
    });

    const updatedInput = await effectifsV3QueueDb().findOne({ _id: insertedId });

    expect(updatedInput?.validation_errors).toMatchObject([
      {
        message: "Date invalide",
        path: ["apprenant", "date_de_naissance"],
      },
      {
        message: "Date invalide",
        path: ["apprenant", "date_metier_mise_a_jour_statut"],
      },
      {
        message: "Date invalide",
        path: ["contrat", "date_debut"],
      },
      {
        message: "Date invalide",
        path: ["contrat", "date_fin"],
      },
      {
        message: "Date invalide",
        path: ["contrat", "date_rupture"],
      },
    ]);

    // check that no data was created
    expect(await effectifsDb().countDocuments({})).toBe(0);
  });

  it("Vérifie l'ajout avec de la donnée valide", async () => {
    const { insertedId } = await effectifsV3QueueDb().insertOne({
      ...(createRandomDossierApprenantApiV3Input({
        apprenant: {
          ine: "402957826QH",
          nom: "FLEURY",
          prenom: "Fortuné",
          date_de_naissance: "1999-08-31T16:21:32",
          email: "Clandre34@hotmail.fr",
          telephone: "+33 534648662",
          id_erp: "9a890d67-e233-46d5-8611-06d6648e7611",
          code_commune_insee: "05109",
          statut: 3,
          date_metier_mise_a_jour_statut: "2022-12-28T04:05:47.647Z",
        },
        contrat: {
          date_debut: "2022-12-28T04:05:47.647Z",
          date_fin: "2022-12-28T04:05:47.647Z",
          date_rupture: "2022-12-28T04:05:47.647Z",
        },
        formation: {
          code_cfd: "50033610",
          libelle_long: "TECHNICIEN D'ETUDES DU BATIMENT OPTION A : ETUDES ET ECONOMIE (BAC PRO)",
          annee: 0,
          periode: "2022-2024",
          annee_scolaire: "2024-2025",
        },
        etablissement_formateur: {
          uai,
          siret,
          nom: "ETABLISSEMENT EMPOWER",
        },
      }) as any),

      created_at: new Date(),
    });

    const result = await processEffectifsQueue({ v3: true });
    const updatedInput = await effectifsV3QueueDb().findOne({ _id: insertedId });

    expect(updatedInput?.error).toBeUndefined();
    expect(updatedInput?.validation_errors).toBeUndefined();
    expect(updatedInput?.processed_at).toBeInstanceOf(Date);

    expect(result).toStrictEqual({
      totalProcessed: 1,
      totalValidItems: 1,
      totalInvalidItems: 0,
    });

    expect(await effectifsDb().countDocuments({})).toBe(1);
  });

  it("Vérifie que la donnée est bien trimmée", async () => {
    const { insertedId } = await effectifsV3QueueDb().insertOne({
      ...(createRandomDossierApprenantApiV3Input({
        apprenant: {
          ine: "  402957826QH  ",
          nom: "  fleury  ",
          prenom: "   Fortuné  ",
          date_de_naissance: "1999-08-31T16:21:32",
          email: "Clandre34@hotmail.fr",
          telephone: "+33 534648662",
          id_erp: "9a890d67-e233-46d5-8611-06d6648e7611",
          code_commune_insee: "05109",
          statut: 3,
          date_metier_mise_a_jour_statut: "2022-12-28T04:05:47.647Z",
        },
        contrat: {
          date_debut: "2022-12-28T04:05:47.647Z",
          date_fin: "2022-12-28T04:05:47.647Z",
          date_rupture: "2022-12-28T04:05:47.647Z",
        },
        formation: {
          code_cfd: "50033610",
          libelle_long: "TECHNICIEN D'ETUDES DU BATIMENT OPTION A : ETUDES ET ECONOMIE (BAC PRO)",
          annee: 0,
          periode: "2022-2024",
          annee_scolaire: "2024-2025",
        },
        etablissement_formateur: {
          uai,
          siret,
          nom: "ETABLISSEMENT EMPOWER",
        },
      }) as any),
      created_at: new Date(),
    });
    const result = await processEffectifsQueue({ v3: true });

    const updatedInput = await effectifsV3QueueDb().findOne({ _id: insertedId });

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
      source: "userApi",
      apprenant: {
        nom: "FLEURY",
        prenom: "Fortuné",
        historique_statut: [
          {
            valeur_statut: 3,
            date_statut: new Date("2022-12-28T04:05:47.647Z"),
            date_reception: expect.any(Date),
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
      contrats: [
        {
          date_debut: new Date("2022-12-28T04:05:47.647Z"),
          date_fin: new Date("2022-12-28T04:05:47.647Z"),
          date_rupture: new Date("2022-12-28T04:05:47.647Z"),
        },
      ],
      formation: {
        cfd: "50033610",
        rncp: expect.any(String),
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
          rncp: true,
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
