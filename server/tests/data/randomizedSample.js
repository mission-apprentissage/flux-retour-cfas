import { faker } from "@faker-js/faker/locale/fr";
import RandExp from "randexp";
import { sampleLibelles } from "./sampleLibelles.js";
import { subMonths, addYears } from "date-fns";
import { CODES_STATUT_APPRENANT } from "../../src/common/constants/dossierApprenantConstants.js";
import { NATURE_ORGANISME_DE_FORMATION } from "../../src/common/utils/validationsUtils/organisme-de-formation/nature.js";
import departements from "../../src/common/constants/departements.js";

const isPresent = () => Math.random() < 0.66;
const getRandomIne = () => new RandExp(/^[0-9]{9}[A-Z]{2}$/).gen().toUpperCase();
export const getRandomFormationCfd = () => new RandExp(/^[0-9]{8}$/).gen().toUpperCase();
const getRandomRncpFormation = () => `RNCP${new RandExp(/^[0-9]{5}$/).gen()}`;
export const getRandomUaiEtablissement = () => new RandExp(/^[0-9]{7}[A-Z]{1}$/).gen().toUpperCase();
export const getRandomSiretEtablissement = () => new RandExp(/^[0-9]{14}$/).gen().toUpperCase();
export const getSampleSiretEtablissement = () => "13002526500013";
const getRandomStatutApprenant = () => faker.helpers.arrayElement(Object.values(CODES_STATUT_APPRENANT));
const getRandomNature = () =>
  faker.helpers.arrayElement([
    NATURE_ORGANISME_DE_FORMATION.FORMATEUR,
    NATURE_ORGANISME_DE_FORMATION.RESPONSABLE,
    NATURE_ORGANISME_DE_FORMATION.RESPONSABLE_FORMATEUR,
  ]);

const getRandomAdresseObject = () => {
  const randomDepartement = departements[faker.helpers.arrayElement(Object.keys(departements))];
  return {
    departement: randomDepartement.code_dept,
    region: randomDepartement.code_region,
    academie: randomDepartement.num_academie.toString(),
  };
};
export const getRandomPeriodeFormation = (anneeScolaire) => {
  const yearToInclude = Number(anneeScolaire.slice(0, 4));
  const startYear = faker.helpers.arrayElement([yearToInclude, yearToInclude - 1, yearToInclude - 2]);
  const endYear = startYear + faker.helpers.arrayElement([1, 2]);
  return [startYear, endYear];
};
const getRandomAnneeFormation = () => faker.helpers.arrayElement([0, 1, 2, 3]);
export const getRandomAnneeScolaire = () => {
  const currentYear = new Date().getFullYear();
  const anneeScolaire = faker.helpers.arrayElement([
    [currentYear - 1, currentYear], // [2020, 2021]
    [currentYear, currentYear + 1], // [2021, 2022]
    [currentYear + 1, currentYear + 2], // [2022, 2023]
  ]);
  return anneeScolaire.join("-");
};
const getRandomDateDebutContrat = () => faker.date.between(subMonths(new Date(), 6), subMonths(new Date(), 1));
const getRandomDateFinContrat = () => faker.date.between(addYears(new Date(), 1), addYears(new Date(), 2));
const getRandomDateRuptureContrat = () => faker.date.between(subMonths(new Date(), 1), addYears(new Date(), 2));
const getRandomDateNaissance = () => faker.date.birthdate({ min: 18, max: 25, mode: "age" });

export const createRandomOrganisme = (params = {}) => ({
  uai: getRandomUaiEtablissement(),
  sirets: [getSampleSiretEtablissement()],
  adresse: getRandomAdresseObject(),
  nature: getRandomNature(),
  nom: `ETABLISSEMENT ${faker.random.word()}`.toUpperCase(),
  ...params,
});

export const createRandomDossierApprenant = (params = {}) => {
  const annee_scolaire = getRandomAnneeScolaire();
  const periode_formation = getRandomPeriodeFormation(annee_scolaire);

  return {
    ine_apprenant: getRandomIne(),
    nom_apprenant: faker.name.lastName().toUpperCase(),
    prenom_apprenant: faker.name.firstName(),
    email_contact: faker.internet.email(),

    formation_cfd: getRandomFormationCfd(),
    ...(faker.datatype.boolean()
      ? { libelle_long_formation: faker.helpers.arrayElement(sampleLibelles).intitule_long }
      : {}),
    uai_etablissement: getRandomUaiEtablissement(),
    siret_etablissement: getSampleSiretEtablissement(),
    nom_etablissement: `ETABLISSEMENT ${faker.random.word()}`.toUpperCase(),

    statut_apprenant: getRandomStatutApprenant(),
    date_metier_mise_a_jour_statut: faker.date.past(),
    ...(isPresent() ? { periode_formation: periode_formation } : {}),
    annee_formation: getRandomAnneeFormation(),
    annee_scolaire,
    id_erp_apprenant: faker.datatype.uuid().toString(),
    ...(faker.datatype.boolean() ? { tel_apprenant: faker.phone.number() } : {}),
    ...(faker.datatype.boolean() ? { code_commune_insee_apprenant: faker.address.zipCode() } : {}),
    date_de_naissance_apprenant: getRandomDateNaissance(),
    ...(faker.datatype.boolean() ? { contrat_date_debut: getRandomDateDebutContrat() } : {}),
    ...(faker.datatype.boolean() ? { contrat_date_fin: getRandomDateFinContrat() } : {}),
    ...(faker.datatype.boolean() ? { contrat_date_rupture: getRandomDateRuptureContrat() } : {}),
    ...(faker.datatype.boolean() ? { formation_rncp: getRandomRncpFormation() } : {}),
    source: faker.random.word(),
    ...params,
  };
};

export const createRandomEffectifApprenant = (params = {}) => {
  const annee_scolaire = getRandomAnneeScolaire();
  const periode_formation = getRandomPeriodeFormation(annee_scolaire);

  return {
    dossierApprenantId: faker.datatype.uuid(),
    uai_etablissement: getRandomUaiEtablissement(),
    nom_etablissement: `ETABLISSEMENT ${faker.random.word()}`.toUpperCase(),
    formation_cfd: getRandomFormationCfd(),
    periode_formation: isPresent() ? periode_formation : null,
    annee_formation: getRandomAnneeFormation(),
    annee_scolaire,
    code_commune_insee_apprenant: faker.datatype.boolean() ? faker.address.zipCode() : null,
    date_de_naissance_apprenant: getRandomDateNaissance(),
    contrat_date_debut: faker.datatype.boolean() ? getRandomDateDebutContrat() : null,
    contrat_date_fin: faker.datatype.boolean() ? getRandomDateDebutContrat() : null,
    contrat_date_rupture: faker.datatype.boolean() ? getRandomDateRuptureContrat() : null,
    formation_rncp: faker.datatype.boolean() ? getRandomRncpFormation() : null,

    ...params,
  };
};

// random DossierApprenant shaped along our REST API schema
export const createRandomDossierApprenantApiInput = (params = {}) => {
  const annee_scolaire = getRandomAnneeScolaire();
  const periode_formation = getRandomPeriodeFormation(annee_scolaire);

  return {
    ine_apprenant: getRandomIne(),
    nom_apprenant: faker.name.lastName().toUpperCase(),
    prenom_apprenant: faker.name.firstName(),
    date_de_naissance_apprenant: getRandomDateNaissance().toISOString().slice(0, -5),

    email_contact: faker.internet.email(),

    id_formation: getRandomFormationCfd(),
    ...(faker.datatype.boolean()
      ? { libelle_long_formation: faker.helpers.arrayElement(sampleLibelles).intitule_long }
      : {}),
    uai_etablissement: getRandomUaiEtablissement(),
    siret_etablissement: getSampleSiretEtablissement(),
    nom_etablissement: `ETABLISSEMENT ${faker.random.word()}`.toUpperCase(),

    statut_apprenant: getRandomStatutApprenant(),
    date_metier_mise_a_jour_statut: faker.date.past().toISOString(),
    annee_formation: getRandomAnneeFormation(),
    ...(isPresent() ? { periode_formation: periode_formation.join("-") } : {}),
    annee_scolaire,
    id_erp_apprenant: faker.datatype.uuid().toString(),
    ...(faker.datatype.boolean() ? { tel_apprenant: faker.phone.number() } : {}),
    ...(faker.datatype.boolean() ? { code_commune_insee_apprenant: faker.address.zipCode() } : {}),
    ...(faker.datatype.boolean() ? { contrat_date_debut: getRandomDateDebutContrat().toISOString() } : {}),
    ...(faker.datatype.boolean() ? { contrat_date_fin: getRandomDateFinContrat().toISOString() } : {}),
    ...(faker.datatype.boolean() ? { contrat_date_rupture: getRandomDateRuptureContrat().toISOString() } : {}),
    ...(faker.datatype.boolean() ? { formation_rncp: getRandomRncpFormation() } : {}),

    ...params,
  };
};

const createRandomListOf =
  (generateItem) =>
  (nbItems = null, params) => {
    const randomList = [];
    if (!nbItems) {
      nbItems = Math.floor(Math.random() * Math.floor(100));
    }
    for (let index = 0; index < nbItems; index++) {
      randomList.push(generateItem(params));
    }
    return randomList;
  };

export const createRandomDossierApprenantApiInputList = createRandomListOf(createRandomDossierApprenantApiInput);

export const createRandomDossierApprenantList = createRandomListOf(createRandomDossierApprenant);
