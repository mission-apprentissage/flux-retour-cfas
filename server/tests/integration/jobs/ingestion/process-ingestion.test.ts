import { ObjectId, WithId, WithoutId } from "mongodb";
import { CODES_STATUT_APPRENANT, SOURCE_APPRENANT } from "shared";
import { IEffectif } from "shared/models/data/effectifs.model";
import { IEffectifQueue } from "shared/models/data/effectifsQueue.model";
import { it, expect, describe, beforeEach } from "vitest";

import { findOrganismeByUaiAndSiret } from "@/common/actions/organismes/organismes.actions";
import { effectifsDb, effectifsQueueDb, organismesDb } from "@/common/model/collections";
import { processEffectifsQueue } from "@/jobs/ingestion/process-ingestion";
import { mockApiApprentissageCertificationApi } from "@tests/data/api.apprentissage.beta.gouv.fr/certification/apiApprentissage.certification.mock";
import { createRandomOrganisme, getRandomSourceOrganismeId } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";
import { useNock } from "@tests/jest/setupNock";

const UAI = "0802004U";
const SIRET = "77937827200016";

const UAI_RESPONSABLE = "0755805C";
const SIRET_RESPONSABLE = "77568013501139";

const ORGANISME_SOURCE_ID = getRandomSourceOrganismeId();
const sortByPath = (array: { path?: Array<string | number> }[] | undefined | null) =>
  array?.sort((a, b) => ((a?.path?.[0] || "") < (b?.path?.[0] || "") ? -1 : 1));

describe("Processus d'ingestion", () => {
  useNock();
  useMongo();

  const commonSampleData = {
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
    formation_rncp: "RNCP 5364", // les espaces sont supprimés
    contrat_date_debut: "2021-09-01T00:00:00.000Z",
    contrat_date_fin: "2022-06-30T00:00:00.000Z",
    contrat_date_rupture: "2022-06-30T00:00:00.000Z",
    has_nir: true,
    adresse_apprenant: "1 rue de la paix",
    code_postal_apprenant: "75001",
    code_postal_de_naissance_apprenant: "75001",
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
    etablissement_lieu_de_formation_adresse: "1 rue de la paix",
    etablissement_lieu_de_formation_code_postal: "75000",
    formation_cfd: "1234ABCD",
    created_at: new Date(),
    source: SOURCE_APPRENANT.FICHIER,
    source_organisme_id: ORGANISME_SOURCE_ID,
  } as const satisfies WithoutId<IEffectifQueue>;

  beforeEach(async () => {
    await organismesDb().insertMany([
      { _id: new ObjectId(), ...createRandomOrganisme({ uai: UAI, siret: SIRET, reseaux: [] }) },
      {
        _id: new ObjectId(),
        ...createRandomOrganisme({ uai: UAI_RESPONSABLE, siret: SIRET_RESPONSABLE, reseaux: [] }),
      },
    ]);

    mockApiApprentissageCertificationApi();
  });

  describe("Ingestion de données valides", () => {
    describe("Ingestion de nouvelles données valides v3", () => {
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
        formation_rncp: "RNCP5364",
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
        etablissement_lieu_de_formation_adresse: "1 rue de la paix",
        etablissement_lieu_de_formation_code_postal: "75000",
        created_at: new Date(),
        source: SOURCE_APPRENANT.FICHIER,
        source_organisme_id: ORGANISME_SOURCE_ID,
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
            courriel: "johndoe@example.org",
            custom_statut_apprenant: null,
            telephone: "0123456789",
            adresse: {
              code_postal: "75001",
              complete: "1 rue de la paix",
              commune: "Paris",
              code_insee: "75056",
              departement: "75",
              academie: "01",
              region: "11",
              mission_locale_id: 609,
            },
            adresse_naissance: {
              code_postal: "75001",
              commune: "Paris",
              code_insee: "75056",
              departement: "75",
              mission_locale_id: 609,
              academie: "01",
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
            rncp: "RNCP5364",
            duree_formation_relle: 10,
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
            libelle_long: "Coiffure",
            niveau: "3",
            niveau_libelle: "3 (CAP...)",
          },
          is_lock: expect.any(Object),
          lieu_de_formation: {
            adresse: "1 rue de la paix",
            code_postal: "75000",
            siret: "77937827200016",
            uai: "0802004U",
          },
          validation_errors: [],
          _raw: {
            formation: {
              annee: 1,
              cause_exclusion: "absences répétées et injustifiées",
              cfd: "1234ABCD",
              date_entree: new Date("2021-09-01T00:00:00.000Z"),
              date_exclusion: new Date("2022-06-30T00:00:00.000Z"),
              date_fin: new Date("2022-06-30T00:00:00.000Z"),
              date_inscription: new Date("2021-09-01T00:00:00.000Z"),
              date_obtention_diplome: new Date("2022-06-30T00:00:00.000Z"),
              duree_formation_relle: 10,
              duree_theorique_mois: 24,
              formation_presentielle: true,
              obtention_diplome: true,
              periode: [],
              referent_handicap: {
                email: "a3@example-example.org",
                nom: "Doe",
                prenom: "John",
              },
              rncp: "RNCP5364",
              libelle_long: null,
            },
          },
          _computed: {
            organisme: {
              academie: "10",
              departement: "01",
              fiable: false,
              region: "84",
              reseaux: [],
              siret: "77937827200016",
              uai: "0802004U",
            },
            formation: {
              codes_rome: null,
              opcos: [],
            },
            statut: {
              en_cours: "FIN_DE_FORMATION",
              parcours: [
                { date: new Date("2021-09-01T00:00:00.000Z"), valeur: "APPRENTI" },
                { date: new Date("2022-06-30T00:00:00.000Z"), valeur: "FIN_DE_FORMATION" },
              ],
            },
          },
          updated_at: expect.any(Date),
          created_at: expect.any(Date),
          transmitted_at: expect.any(Date),
          annee_scolaire: "2021-2022",
          source: SOURCE_APPRENANT.FICHIER,
          source_organisme_id: ORGANISME_SOURCE_ID,
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
            adresse: {
              code_insee: null,
              code_postal: null,
              complete: null,
            },
            adresse_naissance: {
              code_insee: null,
              code_postal: null,
            },
            courriel: null,
            custom_statut_apprenant: null,
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
            responsable_mail1: null,
            responsable_mail2: null,
            rqth: null,
            sexe: null,
            telephone: null,
            type_cfa: null,
            ine: null,
            date_rqth: null,
            dernier_organisme_uai: null,
            derniere_situation: null,
            has_nir: null,
          },
          contrats: [],
          formation: {
            cfd: "50033616", // CFD associé au RNCP
            periode: [],
            rncp: "RNCP34670", // RNCP fiabilisé en fontion de la date d'entrée
            annee: 1,
            date_inscription: new Date("2021-09-01T00:00:00.000Z"),
            libelle_court: "METIERS DE LA COIFFURE",
            libelle_long: "METIERS DE LA COIFFURE (CAP)",
            niveau: "3",
            niveau_libelle: "3 (CAP...)",
            duree_theorique_mois: 24,
            duree_formation_relle: 10,
            date_fin: new Date("2022-06-30T00:00:00.000Z"),
            date_entree: new Date("2021-09-01T00:00:00.000Z"),
            cause_exclusion: null,
            date_exclusion: null,
            date_obtention_diplome: null,
            formation_presentielle: null,
            obtention_diplome: null,
            referent_handicap: null,
          },
          is_lock: expect.any(Object),
          lieu_de_formation: {
            adresse: "1 rue de la paix",
            code_postal: "75000",
            siret: "77937827200016",
            uai: "0802004U",
          },
          validation_errors: [],
          _raw: {
            formation: {
              annee: 1,
              date_entree: new Date("2021-09-01T00:00:00.000Z"),
              date_fin: new Date("2022-06-30T00:00:00.000Z"),
              date_inscription: new Date("2021-09-01T00:00:00.000Z"),
              duree_formation_relle: 10,
              duree_theorique_mois: 24,
              periode: [],
              rncp: "RNCP5364",
              cfd: null,
              cause_exclusion: null,
              date_exclusion: null,
              date_obtention_diplome: null,
              formation_presentielle: null,
              libelle_long: null,
              obtention_diplome: null,
              referent_handicap: null,
            },
          },
          _computed: {
            organisme: {
              academie: "10",
              departement: "01",
              fiable: false,
              region: "84",
              reseaux: [],
              siret: "77937827200016",
              uai: "0802004U",
            },
            formation: {
              codes_rome: ["D1202"],
              opcos: [],
            },
            statut: {
              en_cours: "FIN_DE_FORMATION",
              parcours: [
                {
                  date: new Date("2021-09-01T00:00:00.000Z"),
                  valeur: "INSCRIT",
                },
                {
                  date: new Date("2021-11-30T00:00:00.000Z"),
                  valeur: "ABANDON",
                },
                {
                  date: new Date("2022-06-30T00:00:00.000Z"),
                  valeur: "FIN_DE_FORMATION",
                },
              ],
            },
          },
          updated_at: expect.any(Date),
          created_at: expect.any(Date),
          transmitted_at: expect.any(Date),
          annee_scolaire: "2021-2022",
          source: SOURCE_APPRENANT.FICHIER,
          source_organisme_id: ORGANISME_SOURCE_ID,
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
          formation_rncp: "  34-670  ",
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
            adresse: {
              code_insee: null,
              code_postal: null,
              complete: null,
            },
            adresse_naissance: {
              code_insee: null,
              code_postal: null,
            },
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
            courriel: null,
            custom_statut_apprenant: null,
            date_rqth: null,
            dernier_organisme_uai: null,
            derniere_situation: null,
            ine: null,
            responsable_mail1: null,
            responsable_mail2: null,
            rqth: null,
            telephone: null,
            type_cfa: null,
          },
          contrats: [],
          formation: {
            periode: [],
            cfd: "50033616",
            rncp: "RNCP34670",
            libelle_court: "METIERS DE LA COIFFURE",
            libelle_long: "METIERS DE LA COIFFURE (CAP)",
            niveau: "3",
            niveau_libelle: "3 (CAP...)",
            duree_formation_relle: 10,
            annee: 1,
            date_inscription: new Date("2021-09-01T00:00:00.000Z"),
            duree_theorique_mois: 24,
            date_fin: new Date("2022-06-30T00:00:00.000Z"),
            date_entree: new Date("2021-09-01T00:00:00.000Z"),
            cause_exclusion: null,
            date_exclusion: null,
            date_obtention_diplome: null,
            formation_presentielle: null,
            obtention_diplome: null,
            referent_handicap: null,
          },
          is_lock: expect.any(Object),
          lieu_de_formation: {
            adresse: "1 rue de la paix",
            code_postal: "75000",
            siret: "77937827200016",
            uai: "0802004U",
          },
          validation_errors: [],
          _raw: {
            formation: {
              annee: 1,
              date_entree: new Date("2021-09-01T00:00:00.000Z"),
              date_fin: new Date("2022-06-30T00:00:00.000Z"),
              date_inscription: new Date("2021-09-01T00:00:00.000Z"),
              duree_formation_relle: 10,
              duree_theorique_mois: 24,
              periode: [],
              rncp: "RNCP34670",
              cause_exclusion: null,
              cfd: null,
              date_exclusion: null,
              date_obtention_diplome: null,
              formation_presentielle: null,
              libelle_long: null,
              obtention_diplome: null,
              referent_handicap: null,
            },
          },
          _computed: {
            organisme: {
              academie: "10",
              departement: "01",
              fiable: false,
              region: "84",
              reseaux: [],
              siret: "77937827200016",
              uai: "0802004U",
            },
            formation: {
              codes_rome: ["D1202"],
              opcos: [],
            },
            statut: {
              en_cours: "FIN_DE_FORMATION",
              parcours: [
                {
                  date: new Date("2021-09-01T00:00:00.000Z"),
                  valeur: "INSCRIT",
                },
                {
                  date: new Date("2021-11-30T00:00:00.000Z"),
                  valeur: "ABANDON",
                },
                {
                  date: new Date("2022-06-30T00:00:00.000Z"),
                  valeur: "FIN_DE_FORMATION",
                },
              ],
            },
          },
          updated_at: expect.any(Date),
          created_at: expect.any(Date),
          transmitted_at: expect.any(Date),
          annee_scolaire: "2022-2022",
          source: SOURCE_APPRENANT.FICHIER,
          source_organisme_id: ORGANISME_SOURCE_ID,
          id_erp_apprenant: "123456789",
          organisme_id: new ObjectId(organismeForInput._id),
          organisme_responsable_id: new ObjectId(organismeResponsableForInput._id),
          organisme_formateur_id: new ObjectId(organismeForInput._id),
        } satisfies WithId<IEffectif>);
      });
    });
  });

  describe("Ingestion de données invalides", () => {
    describe("Ingestion de mises à jour de données invalides", () => {
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
