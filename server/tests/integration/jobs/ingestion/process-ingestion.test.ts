import { ObjectId } from "mongodb";

import { createOrganisme, findOrganismeByUaiAndSiret } from "@/common/actions/organismes/organismes.actions";
import { CODES_STATUT_APPRENANT } from "@/common/constants/dossierApprenant";
import { effectifsDb, effectifsQueueDb, organismesReferentielDb } from "@/common/model/collections";
import { processEffectifsQueue } from "@/jobs/ingestion/process-ingestion";
import { createRandomDossierApprenantApiInput, createRandomOrganisme } from "@tests/data/randomizedSample";

const UAI = "0802004U";
const SIRET = "77937827200016";

const UAI_REFERENTIEL_FERME = "4422672E";
const SIRET_REFERENTIEL_FERME = "44370584100099";

const sortByPath = (array: { path?: string[] }[] | undefined) =>
  array?.sort((a, b) => ((a?.path?.[0] || "") < (b?.path?.[0] || "") ? -1 : 1));

describe("Processus d'ingestion", () => {
  beforeEach(async () => {
    await organismesReferentielDb().insertMany([
      {
        uai: UAI,
        siret: SIRET,
        nature: "formateur",
        lieux_de_formation: [{ uai: UAI }],
        relations: [],
      },
      {
        uai: UAI_REFERENTIEL_FERME,
        siret: SIRET_REFERENTIEL_FERME,
        nature: "formateur",
        lieux_de_formation: [{ uai: UAI_REFERENTIEL_FERME }],
        relations: [],
        etat_administratif: "fermé",
      },
    ]);
    await createOrganisme(createRandomOrganisme({ uai: UAI, siret: SIRET }));
  });

  const requiredFields = [
    "prenom_apprenant",
    "nom_apprenant",
    "date_de_naissance_apprenant",
    "id_formation",
    "annee_scolaire",
    "statut_apprenant",
    "date_metier_mise_a_jour_statut",
    "id_erp_apprenant",
  ];

  describe("Ingestion de données valides", () => {
    describe("Ingestion de nouvelles données valides", () => {
      it("Vérifie l'ingestion valide d'un nouveau dossier valide pour un organisme fiable", async () => {
        const sampleData = {
          ine_apprenant: "402957826QH",
          nom_apprenant: "FLEURY",
          prenom_apprenant: "Fortuné",
          date_de_naissance_apprenant: "1999-08-31T16:21:32",
          email_contact: "Clandre34@hotmail.fr",
          id_formation: "50033610",
          libelle_long_formation: "TECHNICIEN D'ETUDES DU BATIMENT OPTION A : ETUDES ET ECONOMIE (BAC PRO)",
          uai_etablissement: UAI,
          siret_etablissement: SIRET,
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

        const organismeForInput = await findOrganismeByUaiAndSiret(UAI, SIRET);
        const effectifForInput = await effectifsDb().findOne({});

        expect(updatedInput?.organisme_id).toStrictEqual(organismeForInput?._id);
        expect(updatedInput?.effectif_id).toStrictEqual(effectifForInput?._id);

        expect(result).toStrictEqual({
          totalProcessed: 1,
          totalValidItems: 1,
          totalInvalidItems: 0,
        });

        // Check nb effectifsQueue
        expect(await effectifsQueueDb().countDocuments({})).toBe(1);

        // TODO : Vérifier le locker
      });

      it("Vérifie l'ingestion valide d'un nouveau dossier valide pour un organisme fiable et que la donnée est bien trimmée", async () => {
        const sampleData = {
          ine_apprenant: "402957826QH",
          nom_apprenant: "  fleury  ",
          prenom_apprenant: "   Fortuné  ",
          date_de_naissance_apprenant: "1999-08-31T16:21:32",
          email_contact: "Clandre34@hotmail.fr",
          id_formation: "50033610",
          libelle_long_formation: "TECHNICIEN D'ETUDES DU BATIMENT OPTION A : ETUDES ET ECONOMIE (BAC PRO)",
          uai_etablissement: UAI,
          siret_etablissement: SIRET,
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

        const organismeForInput = await findOrganismeByUaiAndSiret(UAI, SIRET);
        const effectifForInput = await effectifsDb().findOne({});

        expect(updatedInput?.organisme_id).toStrictEqual(organismeForInput?._id);
        expect(updatedInput?.effectif_id).toStrictEqual(effectifForInput?._id);

        expect(result).toStrictEqual({
          totalProcessed: 1,
          totalValidItems: 1,
          totalInvalidItems: 0,
        });

        // Check nb effectifsQueue
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

    describe("Ingestion de mises à jour de données valides", () => {
      const commonSampleData = {
        ine_apprenant: "772957826QH",
        nom_apprenant: "MBAPPE",
        prenom_apprenant: "Kylian",
        date_de_naissance_apprenant: "1999-08-31T16:21:32",
        email_contact: "mbappe@hotmail.fr",
        id_erp_apprenant: "9a890d67-e233-46d5-8611-06d6648e7611",
        id_formation: "50033610",
        uai_etablissement: UAI,
        siret_etablissement: SIRET,
        libelle_long_formation: "TECHNICIEN D'ETUDES DU BATIMENT OPTION A : ETUDES ET ECONOMIE (BAC PRO)",
        nom_etablissement: "ETABLISSEMENT EMPOWER",
        annee_formation: 0,
        periode_formation: "2022-2024",
        annee_scolaire: "2024-2025",
        tel_apprenant: "+33 534648662",
        code_commune_insee_apprenant: "05109",
        source: "apiUser",
        created_at: new Date(),
      };

      beforeEach(async () => {
        // Création et ingestion d'un dossier valide pour un jeune inscrit à une date donnée
        await effectifsQueueDb().insertOne({
          ...commonSampleData,
          statut_apprenant: CODES_STATUT_APPRENANT.inscrit,
          date_metier_mise_a_jour_statut: "2022-12-28T04:05:47.647Z",
        });
        await processEffectifsQueue();
      });

      it("Vérifie l'ingestion et la mise à jour valide d'un dossier valide déja existant pour un organisme fiable", async () => {
        // Création d'un dossier pour la même clé d'unicité envoyé le lendemain avec un nouveau statut et nouvelle date métier
        const { insertedId } = await effectifsQueueDb().insertOne({
          ...commonSampleData,
          statut_apprenant: CODES_STATUT_APPRENANT.apprenti, // MAJ du statut
          date_metier_mise_a_jour_statut: "2022-12-30T04:05:47.647Z", // MAJ de la date
        });
        const result = await processEffectifsQueue();
        const updatedInput = await effectifsQueueDb().findOne({ _id: insertedId });

        expect(updatedInput?.error).toBeUndefined();
        expect(updatedInput?.validation_errors).toBeUndefined();
        expect(updatedInput?.processed_at).toBeInstanceOf(Date);

        const organismeForInput = await findOrganismeByUaiAndSiret(UAI, SIRET);
        const effectifForInput = await effectifsDb().findOne({});

        expect(updatedInput?.organisme_id).toStrictEqual(organismeForInput?._id);
        expect(updatedInput?.effectif_id).toStrictEqual(effectifForInput?._id);

        expect(result).toStrictEqual({
          totalProcessed: 1,
          totalValidItems: 1,
          totalInvalidItems: 0,
        });

        // Check nb effectifsQueue
        expect(await effectifsQueueDb().countDocuments({})).toBe(2);

        // Check nb d'effectifs
        expect(await effectifsDb().countDocuments({})).toBe(1);

        // Check historique
        const effectifInserted = await effectifsDb().findOne({ id_erp_apprenant: commonSampleData.id_erp_apprenant });
        expect(effectifInserted?.apprenant.historique_statut).toMatchObject([
          {
            date_statut: new Date("2022-12-28T04:05:47.647Z"),
            valeur_statut: CODES_STATUT_APPRENANT.inscrit,
          },
          {
            date_statut: new Date("2022-12-30T04:05:47.647Z"),
            valeur_statut: CODES_STATUT_APPRENANT.apprenti,
          },
        ]);
      });

      it("Vérifie l'ingestion et la non mise à jour d'un dossier dont la clé d'unicité est différente d'un dossier déja existant", async () => {
        // Création d'un dossier pour la même clé d'unicité envoyé le lendemain avec un nouveau statut et nouvelle date métier
        const { insertedId } = await effectifsQueueDb().insertOne({
          ...commonSampleData,
          id_formation: "77733777",
          statut_apprenant: CODES_STATUT_APPRENANT.apprenti, // MAJ du statut
          date_metier_mise_a_jour_statut: "2022-12-30T04:05:47.647Z", // MAJ de la date
        });
        const result = await processEffectifsQueue();
        const updatedInput = await effectifsQueueDb().findOne({ _id: insertedId });

        expect(updatedInput?.error).toBeUndefined();
        expect(updatedInput?.validation_errors).toBeUndefined();
        expect(updatedInput?.processed_at).toBeInstanceOf(Date);

        const organismeForInput = await findOrganismeByUaiAndSiret(UAI, SIRET);
        const effectifForInput = await effectifsDb().findOne({ "formation.cfd": "77733777" });

        expect(updatedInput?.organisme_id).toStrictEqual(organismeForInput?._id);
        expect(updatedInput?.effectif_id).toStrictEqual(effectifForInput?._id);

        expect(result).toStrictEqual({
          totalProcessed: 1,
          totalValidItems: 1,
          totalInvalidItems: 0,
        });

        // Check nb effectifsQueue
        expect(await effectifsQueueDb().countDocuments({})).toBe(2);

        // Check nb d'effectifs
        expect(await effectifsDb().countDocuments({})).toBe(2);

        // Check historiques des effectifs
        const effectifInserted = await effectifsDb().findOne({ "formation.cfd": commonSampleData.id_formation });
        expect(effectifInserted?.apprenant.historique_statut).toMatchObject([
          {
            date_statut: new Date("2022-12-28T04:05:47.647Z"),
            valeur_statut: CODES_STATUT_APPRENANT.inscrit,
          },
        ]);
        expect(effectifForInput?.apprenant.historique_statut).toMatchObject([
          {
            date_statut: new Date("2022-12-30T04:05:47.647Z"),
            valeur_statut: CODES_STATUT_APPRENANT.apprenti,
          },
        ]);
      });
    });
  });

  describe("Ingestion de données invalides", () => {
    describe("Ingestion de nouvelles données invalides", () => {
      it("Vérifie qu'on ne crée pas de donnée et renvoie une erreur lorsque le couple UAI / SIRET ne correspond pas à un organisme fiable", async () => {
        const { insertedId } = await effectifsQueueDb().insertOne({
          ine_apprenant: "402957826QH",
          nom_apprenant: "FLEURY",
          prenom_apprenant: "Fortuné",
          date_de_naissance_apprenant: "1999-08-31T16:21:32",
          email_contact: "Clandre34@hotmail.fr",
          id_formation: "50033610",
          libelle_long_formation: "TECHNICIEN D'ETUDES DU BATIMENT OPTION A : ETUDES ET ECONOMIE (BAC PRO)",
          uai_etablissement: UAI,
          siret_etablissement: "41461021200014",
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
        });

        const result = await processEffectifsQueue();

        expect(result).toStrictEqual({
          totalProcessed: 1,
          totalValidItems: 0,
          totalInvalidItems: 1,
        });

        const updatedInput = await effectifsQueueDb().findOne({ _id: insertedId });

        expect(updatedInput).toMatchObject({
          error: `Organisme (uai : ${UAI} et siret : 41461021200014) non fiable`,
          processed_at: expect.any(Date),
        });
        expect(updatedInput?.organisme_id).toBeUndefined();
        expect(updatedInput?.effectif_id).toBeUndefined();

        // check that no data was created
        expect(await effectifsDb().countDocuments({})).toBe(0);
      });

      it("Vérifie qu'on ne crée pas de donnée et renvoie une erreur lorsque le couple UAI / SIRET correspondent à un organisme fermé", async () => {
        const { insertedId } = await effectifsQueueDb().insertOne({
          ...createRandomDossierApprenantApiInput({
            uai_etablissement: UAI_REFERENTIEL_FERME,
            siret_etablissement: SIRET_REFERENTIEL_FERME,
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
          error: `Organisme (uai : ${UAI_REFERENTIEL_FERME} et siret : ${SIRET_REFERENTIEL_FERME}) non fiable`,
          processed_at: expect.any(Date),
        });
        expect(updatedInput?.organisme_id).toBeUndefined();
        expect(updatedInput?.effectif_id).toBeUndefined();

        // check that no data was created
        expect(await effectifsDb().countDocuments({})).toBe(0);
      });

      requiredFields.forEach(async (requiredField) => {
        it(`Vérifie qu'on ne crée pas de donnée et remonte une erreur lorsque le champ obligatoire '${requiredField}' n'est pas renseigné`, async () => {
          // set required field as undefined
          const { insertedId } = await effectifsQueueDb().insertOne({
            ...createRandomDossierApprenantApiInput({ [requiredField]: undefined }),
            uai_etablissement: UAI,
            siret_etablissement: SIRET,
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
                message: requiredField.includes("date_")
                  ? "Date invalide"
                  : requiredField.includes("statut_apprenant")
                  ? `Valeurs possibles: ${CODES_STATUT_APPRENANT.abandon},${CODES_STATUT_APPRENANT.inscrit},${CODES_STATUT_APPRENANT.apprenti}`
                  : "String attendu",
                path: [requiredField],
              },
            ],
          });
          expect(updatedInput?.organisme_id).toBeUndefined();
          expect(updatedInput?.effectif_id).toBeUndefined();

          // check that no data was created
          expect(await effectifsDb().countDocuments({})).toBe(0);
        });
      });

      it("Vérifie qu'on ne crée pas de donnée et remonte une erreur lorsque le dossier ne respecte pas le format de l'id_formation / rncp pour un organisme fiable", async () => {
        const { insertedId } = await effectifsQueueDb().insertOne({
          ...createRandomDossierApprenantApiInput({
            annee_scolaire: "2021,2022",
            uai_etablissement: UAI,
            formation_rncp: "invalideRncp",
            siret_etablissement: SIRET,
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
        ]);
        expect(updatedInput?.organisme_id).toBeUndefined();
        expect(updatedInput?.effectif_id).toBeUndefined();

        // check that no data was created
        expect(await effectifsDb().countDocuments({})).toBe(0);
      });

      it("Vérifie qu'on ne crée pas de donnée et remonte une erreur lorsque le dossier ne respecte pas le format du nom / prenom du jeune pour un organisme fiable", async () => {
        const sampleData = {
          ine_apprenant: "402957826QH",
          nom_apprenant: 12,
          prenom_apprenant: 18,
          date_de_naissance_apprenant: "1999-08-31T16:21:32",
          email_contact: "Clandre34@hotmail.fr",
          id_formation: "50033610",
          libelle_long_formation: "TECHNICIEN D'ETUDES DU BATIMENT OPTION A : ETUDES ET ECONOMIE (BAC PRO)",
          uai_etablissement: UAI,
          siret_etablissement: SIRET,
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
            message: "String attendu",
            path: ["nom_apprenant"],
          },
          {
            message: "String attendu",
            path: ["prenom_apprenant"],
          },
        ]);
        expect(updatedInput?.organisme_id).toBeUndefined();
        expect(updatedInput?.effectif_id).toBeUndefined();

        // check that no data was created
        expect(await effectifsDb().countDocuments({})).toBe(0);
      });

      it("Vérifie qu'on ne crée pas de donnée et renvoie une erreur lorsque les champs date ne sont pas iso", async () => {
        const { insertedId } = await effectifsQueueDb().insertOne({
          ...createRandomDossierApprenantApiInput({
            uai_etablissement: UAI,
            siret_etablissement: SIRET,
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
        expect(updatedInput?.organisme_id).toBeUndefined();
        expect(updatedInput?.effectif_id).toBeUndefined();

        // check that no data was created
        expect(await effectifsDb().countDocuments({})).toBe(0);
      });

      it("Vérifie qu'on ne crée pas de donnée et remonte une erreur lorsque le dossier ne respecte pas le format de l'année scolaire pour un organisme fiable", async () => {
        const sampleData = {
          ine_apprenant: "402957826QH",
          nom_apprenant: "SMITH",
          prenom_apprenant: "Jean",
          date_de_naissance_apprenant: "1999-08-31T16:21:32",
          email_contact: "Clandre34@hotmail.fr",
          id_formation: "50033610",
          libelle_long_formation: "TECHNICIEN D'ETUDES DU BATIMENT OPTION A : ETUDES ET ECONOMIE (BAC PRO)",
          uai_etablissement: UAI,
          siret_etablissement: SIRET,
          nom_etablissement: "ETABLISSEMENT EMPOWER",
          statut_apprenant: 3,
          date_metier_mise_a_jour_statut: "2022-12-28T04:05:47.647Z",
          annee_formation: 0,
          periode_formation: "2022-2024",
          annee_scolaire: 2024,
          id_erp_apprenant: "9a890d67-e233-46d5-8611-06d6648e7611",
          tel_apprenant: "+33 534648662",
          code_commune_insee_apprenant: "05109",
          source: "apiUser",
          created_at: new Date(),
        };

        const { insertedId } = await effectifsQueueDb().insertOne(sampleData);

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
            message: "String attendu",
            path: ["annee_scolaire"],
          },
        ]);
        expect(updatedInput?.organisme_id).toBeUndefined();
        expect(updatedInput?.effectif_id).toBeUndefined();

        // check that no data was created
        expect(await effectifsDb().countDocuments({})).toBe(0);
      });
    });

    describe("Ingestion de mises à jour de données invalides", () => {
      const commonSampleData = {
        ine_apprenant: "772957826QH",
        nom_apprenant: "MBAPPE",
        prenom_apprenant: "Kylian",
        date_de_naissance_apprenant: "1999-08-31T16:21:32",
        email_contact: "mbappe@hotmail.fr",
        id_erp_apprenant: "9a890d67-e233-46d5-8611-06d6648e7611",
        id_formation: "50033610",
        uai_etablissement: UAI,
        siret_etablissement: SIRET,
        libelle_long_formation: "TECHNICIEN D'ETUDES DU BATIMENT OPTION A : ETUDES ET ECONOMIE (BAC PRO)",
        nom_etablissement: "ETABLISSEMENT EMPOWER",
        annee_formation: 0,
        periode_formation: "2022-2024",
        annee_scolaire: "2024-2025",
        tel_apprenant: "+33 534648662",
        code_commune_insee_apprenant: "05109",
        source: "apiUser",
        created_at: new Date(),
      };

      it("Vérifie la mise à l'écart d'une mise à jour de dossier avec un statut invalide", async () => {
        // Création et ingestion d'un dossier valide pour un jeune inscrit à une date donnée
        await effectifsQueueDb().insertOne({
          ...commonSampleData,
          statut_apprenant: CODES_STATUT_APPRENANT.inscrit,
          date_metier_mise_a_jour_statut: "2022-12-28T04:05:47.647Z",
        });
        await processEffectifsQueue();

        // Création d'un dossier pour la même clé d'unicité envoyé le lendemain avec un statut non valide et nouvelle date métier
        const { insertedId } = await effectifsQueueDb().insertOne({
          ...commonSampleData,
          statut_apprenant: "test", // MAJ du statut avec un statut invalide
          date_metier_mise_a_jour_statut: "2022-12-30T04:05:47.647Z", // MAJ de la date
        });

        const result = await processEffectifsQueue();
        expect(result).toStrictEqual({
          totalProcessed: 1,
          totalValidItems: 0,
          totalInvalidItems: 1,
        });

        const updatedInput = await effectifsQueueDb().findOne({ _id: insertedId });
        expect(sortByPath(updatedInput?.validation_errors)).toStrictEqual([
          {
            message: `Valeurs possibles: ${CODES_STATUT_APPRENANT.abandon},${CODES_STATUT_APPRENANT.inscrit},${CODES_STATUT_APPRENANT.apprenti}`,
            path: ["statut_apprenant"],
          },
        ]);

        expect(updatedInput?.organisme_id).toBeUndefined();
        expect(updatedInput?.effectif_id).toBeUndefined();

        // check effectifs count
        expect(await effectifsDb().countDocuments({})).toBe(1);

        // Check Séquence historique
        const effectifInserted = await effectifsDb().findOne({ id_erp_apprenant: commonSampleData.id_erp_apprenant });
        expect(effectifInserted?.apprenant.historique_statut).toMatchObject([
          {
            date_statut: new Date("2022-12-28T04:05:47.647Z"),
            valeur_statut: CODES_STATUT_APPRENANT.inscrit,
          },
        ]);
      });
    });
  });
});
