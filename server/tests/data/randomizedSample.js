const { faker } = require("@faker-js/faker/locale/fr");
const RandExp = require("randexp");
const sampleLibelles = require("./sampleLibelles.json");
const { subMonths, addYears } = require("date-fns");
const { CODES_STATUT_APPRENANT } = require("../../src/common/constants/dossierApprenantConstants");

const isPresent = () => Math.random() < 0.66;
const getRandomIne = () => new RandExp(/^[0-9]{9}[A-Z]{2}$/).gen().toUpperCase();
const getRandomFormationCfd = () => new RandExp(/^[0-9]{8}$/).gen().toUpperCase();
const getRandomRncpFormation = () => `RNCP${new RandExp(/^[0-9]{5}$/).gen()}`;
const getRandomUaiEtablissement = () => new RandExp(/^[0-9]{7}[A-Z]{1}$/).gen().toUpperCase();
const getRandomSiretEtablissement = () => new RandExp(/^[0-9]{14}$/).gen().toUpperCase();
const getRandomStatutApprenant = () => faker.helpers.arrayElement(Object.values(CODES_STATUT_APPRENANT));
const getRandomPeriodeFormation = (anneeScolaire) => {
  const yearToInclude = Number(anneeScolaire.slice(0, 4));
  const startYear = faker.helpers.arrayElement([yearToInclude, yearToInclude - 1, yearToInclude - 2]);
  const endYear = startYear + faker.helpers.arrayElement([1, 2]);
  return [startYear, endYear];
};
const getRandomAnneeFormation = () => faker.helpers.arrayElement([0, 1, 2, 3]);
const getRandomAnneeScolaire = () => {
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

const createRandomDossierApprenant = (params = {}) => {
  const annee_scolaire = getRandomAnneeScolaire();
  const periode_formation = getRandomPeriodeFormation(annee_scolaire);

  return {
    ine_apprenant: isPresent() ? getRandomIne() : null,
    nom_apprenant: faker.name.lastName().toUpperCase(),
    prenom_apprenant: faker.name.firstName(),
    email_contact: faker.internet.email(),

    formation_cfd: getRandomFormationCfd(),
    libelle_long_formation: faker.datatype.boolean() ? faker.helpers.arrayElement(sampleLibelles).intitule_long : null,
    uai_etablissement: getRandomUaiEtablissement(),
    siret_etablissement: isPresent() ? getRandomSiretEtablissement() : null,
    nom_etablissement: `ETABLISSEMENT ${faker.random.word()}`.toUpperCase(),

    statut_apprenant: getRandomStatutApprenant(),
    date_metier_mise_a_jour_statut: faker.date.past(),
    periode_formation: isPresent() ? periode_formation : null,
    annee_formation: getRandomAnneeFormation(),
    annee_scolaire,
    id_erp_apprenant: faker.datatype.uuid(),
    tel_apprenant: faker.datatype.boolean() ? faker.phone.phoneNumber() : null,
    code_commune_insee_apprenant: faker.datatype.boolean() ? faker.address.zipCode() : null,
    date_de_naissance_apprenant: getRandomDateNaissance(),
    contrat_date_debut: faker.datatype.boolean() ? getRandomDateDebutContrat() : null,
    contrat_date_fin: faker.datatype.boolean() ? getRandomDateFinContrat() : null,
    contrat_date_rupture: faker.datatype.boolean() ? getRandomDateRuptureContrat() : null,
    formation_rncp: faker.datatype.boolean() ? getRandomRncpFormation() : null,
    source: faker.random.word(),
    ...params,
  };
};

const createRandomEffectifApprenant = (params = {}) => {
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
const createRandomDossierApprenantApiInput = (params = {}) => {
  const annee_scolaire = getRandomAnneeScolaire();
  const periode_formation = getRandomPeriodeFormation(annee_scolaire);

  return {
    ine_apprenant: isPresent() ? getRandomIne() : null,
    nom_apprenant: faker.name.lastName().toUpperCase(),
    prenom_apprenant: faker.name.firstName(),
    date_de_naissance_apprenant: getRandomDateNaissance().toISOString().slice(0, -5),

    email_contact: faker.internet.email(),

    id_formation: getRandomFormationCfd(),
    libelle_long_formation: faker.datatype.boolean() ? faker.helpers.arrayElement(sampleLibelles).intitule_long : null,
    uai_etablissement: getRandomUaiEtablissement(),
    siret_etablissement: isPresent() ? getRandomSiretEtablissement() : "",
    nom_etablissement: `ETABLISSEMENT ${faker.random.word()}`.toUpperCase(),

    statut_apprenant: getRandomStatutApprenant(),
    date_metier_mise_a_jour_statut: faker.date.past().toISOString(),
    annee_formation: getRandomAnneeFormation(),
    periode_formation: isPresent() ? periode_formation.join("-") : "",
    annee_scolaire,
    id_erp_apprenant: faker.datatype.uuid(),
    tel_apprenant: faker.datatype.boolean() ? faker.phone.phoneNumber() : null,
    code_commune_insee_apprenant: faker.datatype.boolean() ? faker.address.zipCode() : null,

    contrat_date_debut: faker.datatype.boolean() ? getRandomDateDebutContrat().toISOString() : null,
    contrat_date_fin: faker.datatype.boolean() ? getRandomDateFinContrat().toISOString() : null,
    contrat_date_rupture: faker.datatype.boolean() ? getRandomDateRuptureContrat().toISOString() : null,
    formation_rncp: faker.datatype.boolean() ? getRandomRncpFormation() : null,

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

const createRandomDossierApprenantApiInputList = createRandomListOf(createRandomDossierApprenantApiInput);

const createRandomDossierApprenantList = createRandomListOf(createRandomDossierApprenant);

module.exports = {
  getRandomPeriodeFormation,
  createRandomDossierApprenant,
  createRandomDossierApprenantApiInput,
  createRandomDossierApprenantList,
  createRandomDossierApprenantApiInputList,
  getRandomSiretEtablissement,
  getRandomUaiEtablissement,
  createRandomEffectifApprenant,
  getRandomFormationCfd,
  getRandomAnneeScolaire,
};
