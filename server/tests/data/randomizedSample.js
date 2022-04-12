const faker = require("faker/locale/fr");
const RandExp = require("randexp");
const sampleLibelles = require("./sampleLibelles.json");
const { subYears, subMonths, addYears } = require("date-fns");
const { CODES_STATUT_APPRENANT } = require("../../src/common/constants/dossierApprenantConstants");

const isPresent = () => Math.random() < 0.66;
const getRandomIne = () => new RandExp(/^[0-9]{9}[A-Z]{2}$/).gen().toUpperCase();
const getRandomIdFormation = () => new RandExp(/^[0-9]{8}$/).gen().toUpperCase();
const getRandomRncpFormation = () => `RNCP${new RandExp(/^[0-9]{5}$/).gen()}`;
const getRandomUaiEtablissement = () => new RandExp(/^[0-9]{7}[A-Z]{1}$/).gen().toUpperCase();
const getRandomSiretEtablissement = () => new RandExp(/^[0-9]{14}$/).gen().toUpperCase();
const getRandomStatutApprenant = () => faker.random.arrayElement(Object.values(CODES_STATUT_APPRENANT));
const getRandomPeriodeFormation = (anneeScolaire) => {
  const yearToInclude = Number(anneeScolaire.slice(0, 4));
  const startYear = faker.random.arrayElement([yearToInclude, yearToInclude - 1, yearToInclude - 2]);
  const endYear = startYear + faker.random.arrayElement([1, 2]);
  return [startYear, endYear];
};
const getRandomAnneeFormation = () => faker.random.arrayElement([0, 1, 2, 3]);
const getRandomAnneeScolaire = () => {
  const currentYear = new Date().getFullYear();
  const anneeScolaire = faker.random.arrayElement([
    [currentYear - 1, currentYear], // [2020, 2021]
    [currentYear, currentYear + 1], // [2021, 2022]
    [currentYear + 1, currentYear + 2], // [2022, 2023]
  ]);
  return anneeScolaire.join("-");
};
const getRandomDateDebutContrat = () => faker.date.between(subMonths(new Date(), 6), subMonths(new Date(), 1));
const getRandomDateFinContrat = () => faker.date.between(addYears(new Date(), 1), addYears(new Date(), 2));
const getRandomDateRuptureContrat = () => faker.date.between(subMonths(new Date(), 1), addYears(new Date(), 2));
const getRandomCoordonnates = () => `${faker.address.latitude()},${faker.address.longitude()}`;
const getRandomDateNaissance = () => faker.date.between(subYears(new Date(), 18), subYears(new Date(), 25));

const createRandomDossierApprenant = (params = {}) => {
  const annee_scolaire = getRandomAnneeScolaire();
  const periode_formation = getRandomPeriodeFormation(annee_scolaire);

  return {
    ine_apprenant: isPresent() ? getRandomIne() : null,
    nom_apprenant: faker.name.lastName().toUpperCase(),
    prenom_apprenant: faker.name.firstName(),
    email_contact: faker.internet.email(),

    formation_cfd: getRandomIdFormation(),
    libelle_court_formation: faker.datatype.boolean() ? faker.random.arrayElement(sampleLibelles).intitule_court : null,
    libelle_long_formation: faker.datatype.boolean() ? faker.random.arrayElement(sampleLibelles).intitule_long : null,
    uai_etablissement: getRandomUaiEtablissement(),
    siret_etablissement: isPresent() ? getRandomSiretEtablissement() : null,
    nom_etablissement: `ETABLISSEMENT ${faker.random.word()}`.toUpperCase(),

    statut_apprenant: getRandomStatutApprenant(),
    date_metier_mise_a_jour_statut: faker.date.past(),
    periode_formation: isPresent() ? periode_formation : null,
    annee_formation: getRandomAnneeFormation(),
    annee_scolaire,
    id_erp_apprenant: faker.datatype.boolean() ? faker.datatype.uuid() : null,
    tel_apprenant: faker.datatype.boolean() ? faker.phone.phoneNumber() : null,
    code_commune_insee_apprenant: faker.datatype.boolean() ? faker.address.zipCode() : null,
    date_de_naissance_apprenant: getRandomDateNaissance(),
    etablissement_formateur_geo_coordonnees: faker.datatype.boolean() ? getRandomCoordonnates() : null,
    etablissement_formateur_code_commune_insee: faker.datatype.boolean() ? faker.address.zipCode() : null,
    contrat_date_debut: faker.datatype.boolean() ? getRandomDateDebutContrat() : null,
    contrat_date_fin: faker.datatype.boolean() ? getRandomDateFinContrat() : null,
    contrat_date_rupture: faker.datatype.boolean() ? getRandomDateRuptureContrat() : null,
    date_entree_formation: faker.datatype.boolean() ? getRandomDateRuptureContrat() : null,
    formation_rncp: faker.datatype.boolean() ? getRandomRncpFormation() : null,

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
    etablissement_formateur_code_commune_insee: faker.datatype.boolean() ? faker.address.zipCode() : null,
    etablissement_code_postal: faker.datatype.boolean() ? faker.address.zipCode() : null,
    statut_apprenant: getRandomStatutApprenant(),
    formation_cfd: getRandomIdFormation(),
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

    id_formation: getRandomIdFormation(),
    libelle_court_formation: faker.datatype.boolean() ? faker.random.arrayElement(sampleLibelles).intitule_court : null,
    libelle_long_formation: faker.datatype.boolean() ? faker.random.arrayElement(sampleLibelles).intitule_long : null,
    uai_etablissement: getRandomUaiEtablissement(),
    siret_etablissement: isPresent() ? getRandomSiretEtablissement() : "",
    nom_etablissement: `ETABLISSEMENT ${faker.random.word()}`.toUpperCase(),

    statut_apprenant: getRandomStatutApprenant(),
    date_metier_mise_a_jour_statut: faker.date.past().toISOString(),
    annee_formation: getRandomAnneeFormation(),
    periode_formation: isPresent() ? periode_formation.join("-") : "",
    annee_scolaire,
    id_erp_apprenant: faker.datatype.boolean() ? faker.datatype.uuid() : null,
    tel_apprenant: faker.datatype.boolean() ? faker.phone.phoneNumber() : null,
    code_commune_insee_apprenant: faker.datatype.boolean() ? faker.address.zipCode() : null,

    etablissement_formateur_geo_coordonnees: faker.datatype.boolean() ? getRandomCoordonnates() : null,
    etablissement_formateur_code_commune_insee: faker.datatype.boolean() ? faker.address.zipCode() : null,
    contrat_date_debut: faker.datatype.boolean() ? getRandomDateDebutContrat().toISOString() : null,
    contrat_date_fin: faker.datatype.boolean() ? getRandomDateFinContrat().toISOString() : null,
    contrat_date_rupture: faker.datatype.boolean() ? getRandomDateRuptureContrat().toISOString() : null,
    date_entree_formation: faker.datatype.boolean() ? getRandomDateRuptureContrat().toISOString() : null,
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
};
