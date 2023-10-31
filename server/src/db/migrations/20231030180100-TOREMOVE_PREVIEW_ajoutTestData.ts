// eslint-disable-next-line import/no-extraneous-dependencies, node/no-unpublished-import
import { faker } from "@faker-js/faker";
import { addDays } from "date-fns";
import { Db, ObjectId } from "mongodb";
import RandExp from "randexp";

import { NATURE_ORGANISME_DE_FORMATION } from "@/common/constants/organisme";
import { CFD_REGEX, INE_REGEX, RNCP_REGEX } from "@/common/constants/validations";
import { sampleLibelles } from "@tests/data/sampleLibelles";
import { generate } from "@tests/utils/testUtils";

const commonOrganismeFields = {
  nature: NATURE_ORGANISME_DE_FORMATION.FORMATEUR,
  adresse: {
    departement: "01",
    region: "84",
    academie: "10",
  },
};

const createRandomEffectif = (organismeId) => ({
  apprenant: {
    ine: new RandExp(INE_REGEX).gen().toUpperCase(),
    nom: faker.name.lastName().toUpperCase(),
    prenom: faker.name.firstName(),
    courriel: faker.internet.email(),
    date_de_naissance: faker.date.birthdate({ min: 18, max: 25, mode: "age" }),
    historique_statut: [],
  },
  contrats: [],
  formation: {
    cfd: new RandExp(CFD_REGEX).gen().toUpperCase(),
    periode: [2023 - 2024],
    rncp: new RandExp(RNCP_REGEX).gen(),
    libelle_court: faker.helpers.arrayElement(sampleLibelles).intitule_court,
    libelle_long: faker.helpers.arrayElement(sampleLibelles).intitule_long,
    niveau: "5",
    niveau_libelle: "5 (BTS, DUT...)",
    annee: faker.helpers.arrayElement([0, 1, 2, 3]),
  },
  validation_errors: [],
  created_at: new Date(),
  updated_at: new Date(),
  id_erp_apprenant: faker.datatype.uuid(),
  source: faker.random.word(),
  source_organisme_id: faker.datatype.uuid(),
  annee_scolaire: "2023-2024",
  organisme_id: organismeId,
});

export const up = async (db: Db) => {
  await Promise.all([
    createOfDuplicatesWithoutEffectifs(db),
    createOfDuplicatesWithEffectifsSurNonFiableAvecUtilisateurs(db),
    createOfDuplicatesWithEffectifs(db),
    createOfDuplicatesWithEffectifsDoublons(db),
  ]);
};

/**
 * Création d'organismes sans effectifs
 * Attendu de la fusion : Suppression de l'organisme non fiable
 * @param db
 */
const createOfDuplicatesWithoutEffectifs = async (db: Db) => {
  await db.collection("organismes").insertOne({
    ...commonOrganismeFields,
    uai: "0093400W",
    siret: "00461021200001",
    nom: "OF_SANS_EFFECTIFS",
    raison_sociale: "OF_SANS_EFFECTIFS",
  });

  await db.collection("organismes").insertOne({
    ...commonOrganismeFields,
    siret: "00461021200001",
    nom: "OF_SANS_EFFECTIFS",
    raison_sociale: "OF_SANS_EFFECTIFS",
  });
};

/**
 * Création d'organismes avec effectifs et comptes utilisateurs sur le non fiable
 * Attendu de la fusion : Transfert des 10 effectifs et des 2 comptes utilisateurs du non fiable vers le fiable
 * puis suppression du non fiable avec ses effectifs.
 * @param db
 */
const createOfDuplicatesWithEffectifsSurNonFiableAvecUtilisateurs = async (db: Db) => {
  await db.collection("organismes").insertOne({
    ...commonOrganismeFields,
    uai: "1193400W",
    siret: "11461021200001",
    nom: "OF_EFFECTIFS_SUR_LE_NON_FIABLE",
    raison_sociale: "OF_EFFECTIFS_SUR_LE_NON_FIABLE",
  });

  const { insertedId } = await db.collection("organismes").insertOne({
    ...commonOrganismeFields,
    siret: "11461021200001",
    nom: "OF_EFFECTIFS_SUR_LE_NON_FIABLE",
    raison_sociale: "OF_EFFECTIFS_SUR_LE_NON_FIABLE",
  });

  // Création organisation
  const { insertedId: organisationId } = await db.collection("organisations").insertOne({
    type: "ORGANISME_FORMATION",
    uai: null,
    siret: "11461021200001",
    created_at: new Date(),
  });

  // Création users
  await db.collection("usersMigration").insertMany([
    {
      account_status: "CONFIRMED",
      invalided_token: false,
      password_updated_at: new Date(),
      connection_history: [],
      emails: [],
      created_at: new Date(),
      civility: "Madame",
      nom: "OF_EFFECTIFS_SUR_LE_NON_FIABLE_Nom",
      prenom: "OF_EFFECTIFS_SUR_LE_NON_FIABLE_Prenom",
      fonction: "Directrice",
      email: "OF_EFFECTIFS_SUR_LE_NON_FIABLE_email@tdb.local",
      telephone: "0102030405",
      password: "testPasswordHash",
      has_accept_cgu_version: "v0.1",
      organisation_id: organisationId,
    },
    {
      account_status: "CONFIRMED",
      invalided_token: false,
      password_updated_at: new Date(),
      connection_history: [],
      emails: [],
      created_at: new Date(),
      civility: "Madame",
      nom: "OF_EFFECTIFS_SUR_LE_NON_FIABLE_Nom2",
      prenom: "OF_EFFECTIFS_SUR_LE_NON_FIABLE_Prenom2",
      fonction: "Service administratif",
      email: "OF_EFFECTIFS_SUR_LE_NON_FIABLE_email2@tdb.local",
      telephone: "0102030406",
      password: "testPasswordHash",
      has_accept_cgu_version: "v0.1",
      organisation_id: organisationId,
    },
  ]);

  // ajout effectifs sur le non fiable
  await db.collection("effectifs").insertMany([...generate(10, () => createRandomEffectif(insertedId))]);
};

/**
 * Création d'organismes avec effectifs sur le fiable
 * Attendu de la fusion : Transfert des 5 effectifs du non fiable vers le fiable et des 2 comptes utilisateurs
 * Total des effectifs du fiable = 5 + 3 = 8
 * @param db
 */
const createOfDuplicatesWithEffectifs = async (db: Db) => {
  const { insertedId: fiableId } = await db.collection("organismes").insertOne({
    ...commonOrganismeFields,
    uai: "3393400W",
    siret: "33461021200001",
    nom: "OF_EFFECTIFS_SUR_NON_FIABLE_ET_FIABLE",
    raison_sociale: "OF_EFFECTIFS_SUR_NON_FIABLE_ET_FIABLE",
  });

  const { insertedId: nonFiableId } = await db.collection("organismes").insertOne({
    ...commonOrganismeFields,
    siret: "33461021200001",
    nom: "OF_EFFECTIFS_SUR_NON_FIABLE_ET_FIABLE",
    raison_sociale: "OF_EFFECTIFS_SUR_NON_FIABLE_ET_FIABLE",
  });

  // Création organisation
  const { insertedId: organisationId } = await db.collection("organisations").insertOne({
    type: "ORGANISME_FORMATION",
    uai: null,
    siret: "33461021200001",
    created_at: new Date(),
  });

  // Création users
  await db.collection("usersMigration").insertMany([
    {
      account_status: "CONFIRMED",
      invalided_token: false,
      password_updated_at: new Date(),
      connection_history: [],
      emails: [],
      created_at: new Date(),
      civility: "Madame",
      nom: "OF_EFFECTIFS_SUR_NON_FIABLE_ET_FIABLE_Nom",
      prenom: "OF_EFFECTIFS_SUR_NON_FIABLE_ET_FIABLE_Prenom",
      fonction: "Directrice",
      email: "OF_EFFECTIFS_SUR_NON_FIABLE_ET_FIABLE_email@tdb.local",
      telephone: "0102030405",
      password: "testPasswordHash",
      has_accept_cgu_version: "v0.1",
      organisation_id: organisationId,
    },
    {
      account_status: "CONFIRMED",
      invalided_token: false,
      password_updated_at: new Date(),
      connection_history: [],
      emails: [],
      created_at: new Date(),
      civility: "Madame",
      nom: "OF_EFFECTIFS_SUR_NON_FIABLE_ET_FIABLE_Nom2",
      prenom: "OF_EFFECTIFS_SUR_NON_FIABLE_ET_FIABLE_Prenom2",
      fonction: "Service administratif",
      email: "OF_EFFECTIFS_SUR_NON_FIABLE_ET_FIABLE_email2@tdb.local",
      telephone: "0102030406",
      password: "testPasswordHash",
      has_accept_cgu_version: "v0.1",
      organisation_id: organisationId,
    },
  ]);

  // ajout effectifs sur le non fiable
  await db.collection("effectifs").insertMany([...generate(5, () => createRandomEffectif(nonFiableId))]);

  // ajout effectifs sur le fiable
  await db.collection("effectifs").insertMany([...generate(3, () => createRandomEffectif(fiableId))]);
};

/**
 * Effectifs sur le non fiable en doublon avec des effectifs du fiable :
 * Attendu de la fusion : Transfert des effectifs les plus récents (il y a 2 jours) du non fiable et les lier à l’organisme fiable
 * ensuite on supprime le non fiable et ses effectifs et on supprime les effectifs du fiable les plus anciens (il y a 10 jours)
 * @param db
 */
const createOfDuplicatesWithEffectifsDoublons = async (db: Db) => {
  const { insertedId: doublonsFiableId } = await db.collection("organismes").insertOne({
    ...commonOrganismeFields,
    uai: "4493400W",
    siret: "44461021200001",
    nom: "OF_EFFECTIFS_DOUBLONS",
    raison_sociale: "OF_EFFECTIFS_DOUBLONS",
  });

  const { insertedId: doublonsNonFiableId } = await db.collection("organismes").insertOne({
    ...commonOrganismeFields,
    siret: "44461021200001",
    nom: "OF_EFFECTIFS_DOUBLONS",
    raison_sociale: "OF_EFFECTIFS_DOUBLONS",
  });

  // Création organisation
  const { insertedId: organisationId } = await db.collection("organisations").insertOne({
    type: "ORGANISME_FORMATION",
    uai: null,
    siret: "44461021200001",
    created_at: new Date(),
  });

  // Création users
  await db.collection("usersMigration").insertMany([
    {
      account_status: "CONFIRMED",
      invalided_token: false,
      password_updated_at: new Date(),
      connection_history: [],
      emails: [],
      created_at: new Date(),
      civility: "Madame",
      nom: "ORGANISME_FORMATION_Nom",
      prenom: "ORGANISME_FORMATION_Prenom",
      fonction: "Directrice",
      email: "ORGANISME_FORMATION_email@tdb.local",
      telephone: "0102030405",
      password: "testPasswordHash",
      has_accept_cgu_version: "v0.1",
      organisation_id: organisationId,
    },
    {
      account_status: "CONFIRMED",
      invalided_token: false,
      password_updated_at: new Date(),
      connection_history: [],
      emails: [],
      created_at: new Date(),
      civility: "Madame",
      nom: "ORGANISME_FORMATION_Nom2",
      prenom: "ORGANISME_FORMATION_Prenom2",
      fonction: "Service administratif",
      email: "ORGANISME_FORMATION_email2@tdb.local",
      telephone: "0102030406",
      password: "testPasswordHash",
      has_accept_cgu_version: "v0.1",
      organisation_id: organisationId,
    },
  ]);

  const doublonsEffectifs = [...generate(3, () => createRandomEffectif(new ObjectId(18)))];

  // ajout effectifs sur le non fiable
  await db.collection("effectifs").insertMany(
    doublonsEffectifs.map((item) => ({
      ...item,
      organisme_id: doublonsNonFiableId,
      created_at: addDays(new Date(), -2),
    }))
  );

  // ajout effectifs sur le fiable
  await db.collection("effectifs").insertMany(
    doublonsEffectifs.map((item) => ({
      ...item,
      organisme_id: doublonsFiableId,
      created_at: addDays(new Date(), -10),
    }))
  );
};
