import { ObjectId, WithId, WithoutId } from "mongodb";
import { CODES_STATUT_APPRENANT } from "shared";
import { IEffectif } from "shared/models/data/effectifs.model";
import { IEffectifQueue } from "shared/models/data/effectifsQueue.model";

import { createOrganisme, findOrganismeByUaiAndSiret } from "@/common/actions/organismes/organismes.actions";
import { effectifsDb, effectifsQueueDb, organismesReferentielDb } from "@/common/model/collections";
import { processEffectifsQueue } from "@/jobs/ingestion/process-ingestion";
import { createRandomDossierApprenantApiInput, createRandomOrganisme } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";
import { useNock } from "@tests/jest/setupNock";

const UAI = "0802004U";
const SIRET = "77937827200016";

const UAI_REFERENTIEL_FERME = "4422672E";
const SIRET_REFERENTIEL_FERME = "44370584100099";

const UAI_RESPONSABLE = "0755805C";
const SIRET_RESPONSABLE = "77568013501139";

const sortByPath = (array: { path?: string[] }[] | undefined | null) =>
  array?.sort((a, b) => ((a?.path?.[0] || "") < (b?.path?.[0] || "") ? -1 : 1));

describe("Processus d'ingestion", () => {
  useNock();
  useMongo();

  beforeEach(async () => {
    await organismesReferentielDb().insertMany([
      {
        _id: new ObjectId(),
        uai: UAI,
        siret: SIRET,
        nature: "formateur",
        lieux_de_formation: [{ uai: UAI }],
        relations: [],
      },
      {
        _id: new ObjectId(),
        uai: UAI_RESPONSABLE,
        siret: SIRET_RESPONSABLE,
        nature: "responsable",
        lieux_de_formation: [{ uai: UAI_RESPONSABLE }],
        relations: [],
      },
      {
        _id: new ObjectId(),
        uai: UAI_REFERENTIEL_FERME,
        siret: SIRET_REFERENTIEL_FERME,
        nature: "formateur",
        lieux_de_formation: [{ uai: UAI_REFERENTIEL_FERME }],
        relations: [],
        etat_administratif: "fermé",
      },
    ]);
    await createOrganisme(createRandomOrganisme({ uai: UAI, siret: SIRET }));
    await createOrganisme(createRandomOrganisme({ uai: UAI_RESPONSABLE, siret: SIRET_RESPONSABLE }));
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
          source_organisme_id: "9999999",
          created_at: new Date(),
          _id: new ObjectId(),
        };

        const { insertedId } = await effectifsQueueDb().insertOne({ ...sampleData });
        const result = await processEffectifsQueue();
        const updatedInput = await effectifsQueueDb().findOne({ _id: insertedId });

        expect(updatedInput?.error).toBeUndefined();
        expect(updatedInput?.validation_errors).toBeUndefined();
        expect(updatedInput?.processed_at).toBeInstanceOf(Date);

        const organismeForInput = await findOrganismeByUaiAndSiret(UAI, SIRET);
        const effectifForInput = await effectifsDb().findOne({});

        expect(updatedInput?.organisme_id).toStrictEqual(organismeForInput?._id);
        expect(organismeForInput?.erps).toStrictEqual([sampleData.source]);
        expect(updatedInput?.effectif_id).toStrictEqual(effectifForInput?._id);

        expect(result).toStrictEqual({
          totalProcessed: 1,
          totalValidItems: 1,
          totalInvalidItems: 0,
        });

        // Check nb effectifsQueue
        await expect(effectifsQueueDb().countDocuments({})).resolves.toBe(1);

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
          periode_formation: "2021-2023",
          annee_scolaire: "2022-2023",
          id_erp_apprenant: "9a890d67-e233-46d5-8611-06d6648e7611",
          tel_apprenant: "+33 534648662",
          code_commune_insee_apprenant: "05109",
          source: "apiUser",
          source_organisme_id: "9999999",
          created_at: new Date(),
          _id: new ObjectId(),
        };

        const { insertedId } = await effectifsQueueDb().insertOne({ ...sampleData });
        const result = await processEffectifsQueue();

        const updatedInput = await effectifsQueueDb().findOne({ _id: insertedId });

        expect(updatedInput?.error).toBeUndefined();
        expect(updatedInput?.validation_errors).toBeUndefined();
        expect(updatedInput?.processed_at).toBeInstanceOf(Date);

        const organismeForInput = await findOrganismeByUaiAndSiret(UAI, SIRET);
        const effectifForInput = await effectifsDb().findOne({});

        expect(updatedInput?.organisme_id).toStrictEqual(organismeForInput?._id);
        expect(organismeForInput?.erps).toStrictEqual([sampleData.source]);
        expect(updatedInput?.effectif_id).toStrictEqual(effectifForInput?._id);

        expect(result).toStrictEqual({
          totalProcessed: 1,
          totalValidItems: 1,
          totalInvalidItems: 0,
        });

        // Check nb effectifsQueue
        await expect(effectifsDb().countDocuments({})).resolves.toBe(1);

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
            periode: [2021, 2023],
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

          annee_scolaire: "2022-2023",
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
              fiable: false,
            },
            statut: {
              en_cours: "FIN_DE_FORMATION",
              parcours: [
                {
                  date: new Date("2021-08-01T00:00:00.000Z"),
                  valeur: "INSCRIT",
                },
                {
                  date: new Date("2022-12-28T04:05:47.647Z"),
                  valeur: "APPRENTI",
                },
                {
                  date: new Date("2023-07-31T00:00:00.000Z"),
                  valeur: "FIN_DE_FORMATION",
                },
              ],
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
        source_organisme_id: "9999999",
        created_at: new Date(),
      };

      beforeEach(async () => {
        // Création et ingestion d'un dossier valide pour un jeune inscrit à une date donnée
        await effectifsQueueDb().insertOne({
          ...commonSampleData,
          _id: new ObjectId(),
          statut_apprenant: CODES_STATUT_APPRENANT.inscrit,
          date_metier_mise_a_jour_statut: "2022-12-28T04:05:47.647Z",
        });
        await processEffectifsQueue();
      });

      it("Vérifie l'ingestion et la mise à jour valide d'un dossier valide déja existant pour un organisme fiable", async () => {
        // Création d'un dossier pour la même clé d'unicité envoyé le lendemain avec un nouveau statut et nouvelle date métier
        const { insertedId } = await effectifsQueueDb().insertOne({
          ...commonSampleData,
          _id: new ObjectId(),
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
        expect(organismeForInput?.erps).toStrictEqual([commonSampleData.source]);
        expect(updatedInput?.effectif_id).toStrictEqual(effectifForInput?._id);

        expect(result).toStrictEqual({
          totalProcessed: 1,
          totalValidItems: 1,
          totalInvalidItems: 0,
        });

        // Check nb effectifsQueue
        await expect(effectifsQueueDb().countDocuments({})).resolves.toBe(2);

        // Check nb d'effectifs
        await expect(effectifsDb().countDocuments({})).resolves.toBe(1);

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
          _id: new ObjectId(),
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
        expect(organismeForInput?.erps).toStrictEqual([commonSampleData.source]);
        expect(updatedInput?.effectif_id).toStrictEqual(effectifForInput?._id);

        expect(result).toStrictEqual({
          totalProcessed: 1,
          totalValidItems: 1,
          totalInvalidItems: 0,
        });

        // Check nb effectifsQueue
        await expect(effectifsQueueDb().countDocuments({})).resolves.toBe(2);

        // Check nb d'effectifs
        await expect(effectifsDb().countDocuments({})).resolves.toBe(2);

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

    describe("Ingestion de nouvelles données valides v3", () => {
      const commonSampleData: WithoutId<IEffectifQueue> = {
        nom_apprenant: "Doe",
        prenom_apprenant: "John",
        date_de_naissance_apprenant: "2000-10-28T00:00:00.000Z",
        annee_scolaire: "2021-2022",
        statut_apprenant: CODES_STATUT_APPRENANT.inscrit,
        date_metier_mise_a_jour_statut: "2022-12-28T04:05:47.647Z",
        id_erp_apprenant: "123456789",
        api_version: "v3",
        ine_apprenant: "1234567890A",
        email_contact: "johndoe@example.org",
        tel_apprenant: "0123456789",
        libelle_court_formation: "CAP",
        annee_formation: 1,
        formation_rncp: "RNCP 123", // les espaces sont supprimés
        contrat_date_debut: "2021-09-01T00:00:00.000Z",
        contrat_date_fin: "2022-06-30T00:00:00.000Z",
        contrat_date_rupture: "2022-06-30T00:00:00.000Z",
        has_nir: true,
        adresse_apprenant: "1 rue de la paix",
        code_postal_apprenant: "75000",
        code_postal_de_naissance_apprenant: "44000",
        sexe_apprenant: "F",
        rqth_apprenant: true,
        date_rqth_apprenant: "2021-09-01T00:00:00.000Z",
        responsable_apprenant_mail1: "a1@example.org",
        responsable_apprenant_mail2: "a2@example.org",
        derniere_situation: 4001,
        dernier_organisme_uai: "1234567X",
        type_cfa: "4",
        obtention_diplome_formation: true,
        date_obtention_diplome_formation: "2022-06-30T00:00:00.000Z",
        date_exclusion_formation: "2022-06-30T00:00:00.000Z",
        cause_exclusion_formation: "absences répétées et injustifiées",
        nom_referent_handicap_formation: "Doe",
        prenom_referent_handicap_formation: "John",
        email_referent_handicap_formation: "a3@example-example.org",
        cause_rupture_contrat: "abandon",
        contrat_date_debut_2: "2021-09-01T00:00:00.000Z",
        contrat_date_fin_2: "2022-06-30T00:00:00.000Z",
        contrat_date_rupture_2: "2022-06-30T00:00:00.000Z",
        cause_rupture_contrat_2: "abandon",
        siret_employeur: "123 456 7890 1234",
        siret_employeur_2: "12345678901234",
        formation_presentielle: true,
        date_inscription_formation: "2021-09-01T00:00:00.000Z",
        date_entree_formation: "2021-09-01T00:00:00.000Z",
        date_fin_formation: "2022-06-30T00:00:00.000Z",
        duree_theorique_formation_mois: 24,
        etablissement_responsable_uai: UAI_RESPONSABLE,
        etablissement_responsable_siret: SIRET_RESPONSABLE,
        etablissement_formateur_uai: UAI,
        etablissement_formateur_siret: SIRET,
        etablissement_lieu_de_formation_uai: UAI,
        etablissement_lieu_de_formation_siret: SIRET,
        formation_cfd: "1234ABCD",
        created_at: new Date(),
        source: "SOURCE_TEST",
        source_organisme_id: "9999999",
      };

      const minimalSampleData: IEffectifQueue = {
        nom_apprenant: "Doe",
        prenom_apprenant: "John",
        date_de_naissance_apprenant: "2000-10-28T00:00:00.000Z",
        annee_scolaire: "2021-2022",
        statut_apprenant: CODES_STATUT_APPRENANT.inscrit,
        date_metier_mise_a_jour_statut: "2022-12-28T04:05:47.647Z",
        id_erp_apprenant: "123456789",
        api_version: "v3",
        annee_formation: 1,
        formation_rncp: "RNCP123",
        date_inscription_formation: "2021-09-01T00:00:00.000Z",
        date_entree_formation: "2021-09-01T00:00:00.000Z",
        date_fin_formation: "2022-06-30T00:00:00.000Z",
        duree_theorique_formation_mois: 24,
        etablissement_responsable_uai: UAI_RESPONSABLE,
        etablissement_responsable_siret: SIRET_RESPONSABLE,
        etablissement_formateur_uai: UAI,
        etablissement_formateur_siret: SIRET,
        etablissement_lieu_de_formation_uai: UAI,
        etablissement_lieu_de_formation_siret: SIRET,
        created_at: new Date(),
        source: "SOURCE_TEST",
        source_organisme_id: "9999999",
        _id: new ObjectId(),
      };

      it("Vérifie l'ingestion valide d'un nouveau dossier valide v3 pour un organisme fiable", async () => {
        const organismeForInput = await findOrganismeByUaiAndSiret(UAI, SIRET);
        if (!organismeForInput) throw new Error("Organisme non trouvé");

        const organismeResponsableForInput = await findOrganismeByUaiAndSiret(UAI_RESPONSABLE, SIRET_RESPONSABLE);
        if (!organismeResponsableForInput) throw new Error("Organisme responsable non trouvé");

        const { insertedId } = await effectifsQueueDb().insertOne({ ...commonSampleData, _id: new ObjectId() });
        const result = await processEffectifsQueue();
        const updatedInput = await effectifsQueueDb().findOne({ _id: insertedId });

        expect(updatedInput?.error).toBeUndefined();
        expect(updatedInput?.validation_errors).toBeUndefined();
        expect(updatedInput?.processed_at).toBeInstanceOf(Date);

        const organismeForInputUpdated = await findOrganismeByUaiAndSiret(UAI, SIRET);
        expect(organismeForInputUpdated?.erps).toStrictEqual([commonSampleData.source]);

        const effectifForInput = await effectifsDb().findOne({ _id: updatedInput?.effectif_id as ObjectId });
        if (!effectifForInput) throw new Error("IEffectif non trouvé");

        expect(updatedInput?.organisme_id).toStrictEqual(organismeForInput._id);

        expect(result).toStrictEqual({
          totalProcessed: 1,
          totalValidItems: 1,
          totalInvalidItems: 0,
        });

        // Check nb effectifsQueue
        await expect(effectifsQueueDb().countDocuments({})).resolves.toBe(1);

        const insertedDossier = await effectifsDb().findOne({});

        expect(insertedDossier).toStrictEqual({
          _id: effectifForInput._id,
          apprenant: {
            historique_statut: [
              {
                valeur_statut: 2,
                date_statut: new Date("2022-12-28T04:05:47.647Z"),
                date_reception: expect.any(Date),
              },
            ],
            ine: "1234567890A",
            nom: "DOE",
            prenom: "John",
            date_de_naissance: new Date("2000-10-28T00:00:00.000Z"),
            code_postal_de_naissance: "44000",
            courriel: "johndoe@example.org",
            telephone: "+33123456789",
            adresse: {
              code_postal: "75000",
              complete: "1 rue de la paix",
              commune: "[NOM_DE_LA_COMMUNE]",
              code_insee: "75000",
              departement: "75",
              academie: "1",
              region: "11",
            },
            sexe: "F",
            rqth: true,
            date_rqth: new Date("2021-09-01T00:00:00.000Z"),
            has_nir: true,
            responsable_mail1: "a1@example.org",
            responsable_mail2: "a2@example.org",
            derniere_situation: 4001,
            dernier_organisme_uai: "1234567X",
            type_cfa: "04",
          },
          contrats: [
            {
              date_debut: new Date("2021-09-01T00:00:00.000Z"),
              date_fin: new Date("2022-06-30T00:00:00.000Z"),
              date_rupture: new Date("2022-06-30T00:00:00.000Z"),
              cause_rupture: "abandon",
              siret: "12345678901234",
            },
            {
              date_debut: new Date("2021-09-01T00:00:00.000Z"),
              date_fin: new Date("2022-06-30T00:00:00.000Z"),
              date_rupture: new Date("2022-06-30T00:00:00.000Z"),
              cause_rupture: "abandon",
              siret: "12345678901234",
            },
          ],
          formation: {
            periode: [],
            cfd: "1234ABCD",
            rncp: "RNCP123",
            annee: 1,
            obtention_diplome: true,
            date_obtention_diplome: new Date("2022-06-30T00:00:00.000Z"),
            date_exclusion: new Date("2022-06-30T00:00:00.000Z"),
            cause_exclusion: "absences répétées et injustifiées",
            referent_handicap: {
              nom: "Doe",
              prenom: "John",
              email: "a3@example-example.org",
            },
            date_inscription: new Date("2021-09-01T00:00:00.000Z"),
            duree_theorique_mois: 24,
            formation_presentielle: true,
            date_fin: new Date("2022-06-30T00:00:00.000Z"),
            date_entree: new Date("2021-09-01T00:00:00.000Z"),
          },
          is_lock: expect.any(Object),
          validation_errors: [],
          _computed: {
            organisme: {
              region: "84",
              departement: "01",
              academie: "10",
              uai: "0802004U",
              siret: "77937827200016",
              reseaux: [],
              fiable: false,
            },

            statut: {
              en_cours: "FIN_DE_FORMATION",
              parcours: [
                { date: new Date("2021-09-01T00:00:00.000Z"), valeur: "INSCRIT" },
                { date: new Date("2021-09-01T00:00:00.000Z"), valeur: "APPRENTI" },
                { date: new Date("2022-06-30T00:00:00.000Z"), valeur: "RUPTURANT" },
                { date: new Date("2022-06-30T00:00:00.000Z"), valeur: "FIN_DE_FORMATION" },
              ],
            },
          },
          updated_at: expect.any(Date),
          created_at: expect.any(Date),
          annee_scolaire: "2021-2022",
          source: "SOURCE_TEST",
          source_organisme_id: "9999999",
          id_erp_apprenant: "123456789",
          organisme_id: new ObjectId(organismeForInput._id),
          organisme_responsable_id: new ObjectId(organismeResponsableForInput._id),
          organisme_formateur_id: new ObjectId(organismeForInput._id),
        } satisfies WithId<IEffectif>);
      });

      it("Vérifie l'ingestion valide d'un nouveau dossier valide v3 pour un organisme fiable avec seulement les champs obligatoires", async () => {
        const organismeForInput = await findOrganismeByUaiAndSiret(UAI, SIRET);
        if (!organismeForInput) throw new Error("Organisme non trouvé");

        const organismeResponsableForInput = await findOrganismeByUaiAndSiret(UAI_RESPONSABLE, SIRET_RESPONSABLE);
        if (!organismeResponsableForInput) throw new Error("Organisme responsable non trouvé");

        const { insertedId } = await effectifsQueueDb().insertOne({ ...minimalSampleData });
        const result = await processEffectifsQueue();
        const updatedInput = await effectifsQueueDb().findOne({ _id: insertedId });

        expect(updatedInput?.error).toBeUndefined();
        expect(updatedInput?.validation_errors).toBeUndefined();
        expect(updatedInput?.processed_at).toBeInstanceOf(Date);

        const effectifForInput = await effectifsDb().findOne({ _id: updatedInput?.effectif_id as any });
        if (!effectifForInput) throw new Error("IEffectif non trouvé");

        expect(updatedInput?.organisme_id).toStrictEqual(organismeForInput._id);

        const organismeUpdatedForInput = await findOrganismeByUaiAndSiret(UAI, SIRET);
        expect(organismeUpdatedForInput?.erps).toStrictEqual([minimalSampleData.source]);

        expect(result).toStrictEqual({
          totalProcessed: 1,
          totalValidItems: 1,
          totalInvalidItems: 0,
        });

        // Check nb effectifsQueue
        await expect(effectifsQueueDb().countDocuments({})).resolves.toBe(1);

        const insertedDossier = await effectifsDb().findOne({});

        expect(insertedDossier).toStrictEqual({
          _id: effectifForInput?._id,
          apprenant: {
            adresse: {},
            historique_statut: [
              {
                valeur_statut: 2,
                date_statut: new Date("2022-12-28T04:05:47.647Z"),
                date_reception: expect.any(Date),
              },
            ],
            nom: "DOE",
            prenom: "John",
            date_de_naissance: new Date("2000-10-28T00:00:00.000Z"),
          },
          contrats: [],
          formation: {
            periode: [],
            rncp: "RNCP123",
            annee: 1,
            date_inscription: new Date("2021-09-01T00:00:00.000Z"),
            duree_theorique_mois: 24,
            date_fin: new Date("2022-06-30T00:00:00.000Z"),
            date_entree: new Date("2021-09-01T00:00:00.000Z"),
          },
          is_lock: expect.any(Object),
          validation_errors: [],
          _computed: {
            organisme: {
              region: "84",
              departement: "01",
              academie: "10",
              uai: "0802004U",
              siret: "77937827200016",
              reseaux: [],
              fiable: false,
            },
            statut: {
              en_cours: "ABANDON",
              parcours: [
                {
                  date: new Date("2021-09-01T00:00:00.000Z"),
                  valeur: "INSCRIT",
                },
                {
                  date: new Date("2021-11-30T00:00:00.000Z"),
                  valeur: "ABANDON",
                },
              ],
            },
          },
          updated_at: expect.any(Date),
          created_at: expect.any(Date),
          annee_scolaire: "2021-2022",
          source: "SOURCE_TEST",
          source_organisme_id: "9999999",
          id_erp_apprenant: "123456789",
          organisme_id: new ObjectId(organismeForInput._id),
          organisme_responsable_id: new ObjectId(organismeResponsableForInput._id),
          organisme_formateur_id: new ObjectId(organismeForInput._id),
        } satisfies WithId<IEffectif>);
      });

      it("Vérifie l'ingestion et la mise à jour valide d'un dossier valide v3 déja existant pour un organisme fiable", async () => {
        const organismeForInput = await findOrganismeByUaiAndSiret(UAI, SIRET);
        if (!organismeForInput) throw new Error("Organisme non trouvé");

        // Ingestion d'un premier dossier et traitement.
        await effectifsQueueDb().insertOne({
          ...commonSampleData,
          _id: new ObjectId(),
          id_erp_apprenant: "987654321",
          statut_apprenant: CODES_STATUT_APPRENANT.inscrit,
          date_metier_mise_a_jour_statut: "2023-07-12T04:05:47.647Z",
        });
        await processEffectifsQueue();

        // Création d'un dossier pour la même clé d'unicité envoyé le lendemain avec un nouveau statut et nouvelle date métier
        const { insertedId } = await effectifsQueueDb().insertOne({
          ...commonSampleData,
          _id: new ObjectId(),
          id_erp_apprenant: "987654321",
          statut_apprenant: CODES_STATUT_APPRENANT.apprenti, // MAJ du statut
          date_metier_mise_a_jour_statut: "2023-07-13T04:05:47.647Z", // MAJ de la date
        });

        const result = await processEffectifsQueue();
        const updatedInput = await effectifsQueueDb().findOne({ _id: insertedId });

        expect(updatedInput?.error).toBeUndefined();
        expect(updatedInput?.validation_errors).toBeUndefined();
        expect(updatedInput?.processed_at).toBeInstanceOf(Date);

        const effectifForInput = await effectifsDb().findOne({ _id: updatedInput?.effectif_id as any });

        expect(updatedInput?.organisme_id).toStrictEqual(organismeForInput?._id);
        expect(updatedInput?.effectif_id).toStrictEqual(effectifForInput?._id);

        const organismeUpdatedForInput = await findOrganismeByUaiAndSiret(UAI, SIRET);
        expect(organismeUpdatedForInput?.erps).toStrictEqual([commonSampleData.source]);

        expect(result).toStrictEqual({
          totalProcessed: 1,
          totalValidItems: 1,
          totalInvalidItems: 0,
        });

        // Check nb effectifsQueue
        await expect(effectifsQueueDb().countDocuments({})).resolves.toBe(2);

        // Check nb d'effectifs
        await expect(effectifsDb().countDocuments({})).resolves.toBe(1);

        // Check historique
        const effectifInserted = await effectifsDb().findOne({ id_erp_apprenant: "987654321" });
        expect(effectifInserted?.apprenant.historique_statut).toMatchObject([
          {
            date_reception: expect.any(Date),
            date_statut: new Date("2023-07-12T04:05:47.647Z"),
            valeur_statut: CODES_STATUT_APPRENANT.inscrit,
          },
          {
            date_reception: expect.any(Date),
            date_statut: new Date("2023-07-13T04:05:47.647Z"),
            valeur_statut: CODES_STATUT_APPRENANT.apprenti,
          },
        ]);
      });

      it("Vérifie l'ingestion valide d'un nouveau dossier valide v3 avec des données automatiquement corrigées (cas à la marge)", async () => {
        const organismeForInput = await findOrganismeByUaiAndSiret(UAI, SIRET);
        if (!organismeForInput) throw new Error("Organisme non trouvé");

        const organismeResponsableForInput = await findOrganismeByUaiAndSiret(UAI_RESPONSABLE, SIRET_RESPONSABLE);
        if (!organismeResponsableForInput) throw new Error("Organisme responsable non trouvé");
        const { duree_theorique_formation_mois, ...minimumWithoutDureeTheorique } = minimalSampleData;
        const { insertedId } = await effectifsQueueDb().insertOne({
          ...minimumWithoutDureeTheorique,
          // Ajouter ici des cas particuliers qui sont automatiquement corrigés
          // Le numéro de téléphone est nullifié
          tel_apprenant: "",
          // L'année scolaire accepte des dates identiques
          annee_scolaire: "2022-2022",
          // La chaine RNCP est ajoutée au début du nombre
          formation_rncp: "  12-3  ",
          has_nir: true,
          // Le sexe peut être un number
          sexe_apprenant: 2,
          // duree_theorique_formation est transformé en mois
          duree_theorique_formation: 2,
        });
        const result = await processEffectifsQueue();
        const updatedInput = await effectifsQueueDb().findOne({ _id: insertedId });

        expect(updatedInput?.error).toBeUndefined();
        expect(updatedInput?.validation_errors).toBeUndefined();
        expect(updatedInput?.processed_at).toBeInstanceOf(Date);

        const effectifForInput = await effectifsDb().findOne({ _id: updatedInput?.effectif_id as any });
        if (!effectifForInput) throw new Error("IEffectif non trouvé");

        expect(result).toStrictEqual({
          totalProcessed: 1,
          totalValidItems: 1,
          totalInvalidItems: 0,
        });

        const insertedDossier = await effectifsDb().findOne({});

        expect(insertedDossier).toStrictEqual({
          _id: effectifForInput?._id,
          apprenant: {
            adresse: {},
            historique_statut: [
              {
                valeur_statut: 2,
                date_statut: new Date("2022-12-28T04:05:47.647Z"),
                date_reception: expect.any(Date),
              },
            ],
            nom: "DOE",
            prenom: "John",
            date_de_naissance: new Date("2000-10-28T00:00:00.000Z"),
            has_nir: true,
            sexe: "F",
          },
          contrats: [],
          formation: {
            periode: [],
            rncp: "RNCP123",
            annee: 1,
            date_inscription: new Date("2021-09-01T00:00:00.000Z"),
            duree_theorique_mois: 24,
            date_fin: new Date("2022-06-30T00:00:00.000Z"),
            date_entree: new Date("2021-09-01T00:00:00.000Z"),
          },
          is_lock: expect.any(Object),
          validation_errors: [],
          _computed: {
            organisme: {
              region: "84",
              departement: "01",
              academie: "10",
              uai: "0802004U",
              siret: "77937827200016",
              reseaux: [],
              fiable: false,
            },

            statut: {
              en_cours: "ABANDON",
              parcours: [
                {
                  date: new Date("2021-09-01T00:00:00.000Z"),
                  valeur: "INSCRIT",
                },
                {
                  date: new Date("2021-11-30T00:00:00.000Z"),
                  valeur: "ABANDON",
                },
              ],
            },
          },
          updated_at: expect.any(Date),
          created_at: expect.any(Date),
          annee_scolaire: "2022-2022",
          source: "SOURCE_TEST",
          source_organisme_id: "9999999",
          id_erp_apprenant: "123456789",
          organisme_id: new ObjectId(organismeForInput._id),
          organisme_responsable_id: new ObjectId(organismeResponsableForInput._id),
          organisme_formateur_id: new ObjectId(organismeForInput._id),
        } satisfies WithId<IEffectif>);
      });
    });
  });

  describe("Ingestion de données invalides", () => {
    describe("Ingestion de nouvelles données invalides", () => {
      requiredFields.forEach(async (requiredField) => {
        it(`Vérifie qu'on ne crée pas de donnée et remonte une erreur lorsque le champ obligatoire '${requiredField}' n'est pas renseigné`, async () => {
          // set required field as undefined
          const { insertedId } = await effectifsQueueDb().insertOne({
            ...createRandomDossierApprenantApiInput({ [requiredField]: undefined }),
            uai_etablissement: UAI,
            siret_etablissement: SIRET,
            source_organisme_id: "9999999",
            created_at: new Date(),
            _id: new ObjectId(),
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
          await expect(effectifsDb().countDocuments({})).resolves.toBe(0);
        });
      });

      it("Vérifie qu'on ne crée pas de donnée et remonte une erreur lorsque le dossier ne respecte pas le format de l'id_formation / rncp pour un organisme fiable", async () => {
        const { insertedId } = await effectifsQueueDb().insertOne({
          _id: new ObjectId(),
          ...createRandomDossierApprenantApiInput({
            annee_scolaire: "2021-2022",
            uai_etablissement: UAI,
            formation_rncp: "invalideRncp",
            siret_etablissement: SIRET,
            id_formation: "invalideIdFormation",
          }),
          source_organisme_id: "9999999",
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
        await expect(effectifsDb().countDocuments({})).resolves.toBe(0);
      });

      it("Vérifie qu'on ne crée pas de donnée et remonte une erreur lorsque le dossier ne respecte pas le format du nom / prenom du jeune pour un organisme fiable", async () => {
        const sampleData: IEffectifQueue = {
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
          source_organisme_id: "9999999",
          created_at: new Date(),
          _id: new ObjectId(),
        };

        const { insertedId } = await effectifsQueueDb().insertOne({ ...sampleData });

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
        await expect(effectifsDb().countDocuments({})).resolves.toBe(0);
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
          source_organisme_id: "9999999",
          created_at: new Date(),
          _id: new ObjectId(),
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
        await expect(effectifsDb().countDocuments({})).resolves.toBe(0);
      });

      it.each([[2024], ["2024"], ["2021,2022"], ["2023-2025"], ["2010-2026"], ["2023-2021"]])(
        "Vérifie qu'on ne crée pas de donnée et remonte une erreur lorsque le dossier ne respecte pas le format de l'année scolaire pour un organisme fiable",
        async (wrongAnneeScolaire) => {
          const sampleData: IEffectifQueue = {
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
            source_organisme_id: "9999999",
            created_at: new Date(),
            _id: new ObjectId(),
          };

          const { insertedId } = await effectifsQueueDb().insertOne({
            ...sampleData,
            annee_scolaire: wrongAnneeScolaire,
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
              message:
                "Format invalide (format attendu : 2023-2024). Les années doivent être consécutives ou identiques (ex : 2023-2024 ou 2023-2023)",
              path: ["annee_scolaire"],
            },
          ]);
          expect(updatedInput?.organisme_id).toBeUndefined();
          expect(updatedInput?.effectif_id).toBeUndefined();

          // check that no data was created
          await expect(effectifsDb().countDocuments({})).resolves.toBe(0);
        }
      );
    });

    describe("Ingestion de mises à jour de données invalides", () => {
      const commonSampleData: WithoutId<IEffectifQueue> = {
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
        source_organisme_id: "9999999",
        created_at: new Date(),
      };

      it("Vérifie la mise à l'écart d'une mise à jour de dossier avec un statut invalide", async () => {
        // Création et ingestion d'un dossier valide pour un jeune inscrit à une date donnée
        await effectifsQueueDb().insertOne({
          ...commonSampleData,
          _id: new ObjectId(),
          statut_apprenant: CODES_STATUT_APPRENANT.inscrit,
          date_metier_mise_a_jour_statut: "2022-12-28T04:05:47.647Z",
        });
        await processEffectifsQueue();

        // Création d'un dossier pour la même clé d'unicité envoyé le lendemain avec un statut non valide et nouvelle date métier
        const { insertedId } = await effectifsQueueDb().insertOne({
          ...commonSampleData,
          _id: new ObjectId(),
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
        await expect(effectifsDb().countDocuments({})).resolves.toBe(1);

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
