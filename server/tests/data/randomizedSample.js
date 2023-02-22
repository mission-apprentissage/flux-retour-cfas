import { faker } from "@faker-js/faker/locale/fr";
import RandExp from "randexp";
import { sampleLibelles } from "./sampleLibelles.js";
import { subMonths, addYears } from "date-fns";
import { CODES_STATUT_APPRENANT } from "../../src/common/constants/dossierApprenantConstants.js";
import sampleEtablissements from "./sampleEtablissements.js";

const isPresent = () => Math.random() < 0.66;
const getRandomIne = () => new RandExp(/^[0-9]{9}[A-Z]{2}$/).gen().toUpperCase();
export const getRandomFormationCfd = () => new RandExp(/^[0-9]{8}$/).gen().toUpperCase();
const getRandomRncpFormation = () => `RNCP${new RandExp(/^[0-9]{5}$/).gen()}`;
export const getRandomEtablissement = (siret) =>
  siret ? sampleEtablissements[siret] : faker.helpers.arrayElement(Object.values(sampleEtablissements));
const getRandomStatutApprenant = () => faker.helpers.arrayElement(Object.values(CODES_STATUT_APPRENANT));

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
    [currentYear - 1, currentYear],
    [currentYear, currentYear + 1],
    [currentYear + 1, currentYear + 2],
  ]);
  return anneeScolaire.join("-");
};
const getRandomDateDebutContrat = () => faker.date.between(subMonths(new Date(), 6), subMonths(new Date(), 1));
const getRandomDateFinContrat = () => faker.date.between(addYears(new Date(), 1), addYears(new Date(), 2));
const getRandomDateRuptureContrat = () => faker.date.between(subMonths(new Date(), 1), addYears(new Date(), 2));
const getRandomDateNaissance = () => faker.date.birthdate({ min: 18, max: 25, mode: "age" });

export const createRandomOrganisme = (params = {}) => {
  const { ...etablissement } = getRandomEtablissement(params?.siret);
  return {
    ...etablissement,
    ...params,
  };
};

export const createRandomDossierApprenant = (params = {}) => {
  const annee_scolaire = getRandomAnneeScolaire();
  const periode_formation = getRandomPeriodeFormation(annee_scolaire);
  const isStudentPresent = isPresent();
  const isContratPresent = isPresent();

  const { siret, uai } = getRandomEtablissement();

  return {
    ine_apprenant: getRandomIne(),
    nom_apprenant: faker.name.lastName().toUpperCase(),
    prenom_apprenant: faker.name.firstName(),
    email_contact: faker.internet.email(),
    formation_cfd: getRandomFormationCfd(),
    libelle_long_formation: faker.helpers.arrayElement(sampleLibelles).intitule_long,
    uai_etablissement: uai,
    siret_etablissement: isStudentPresent ? siret : null,
    nom_etablissement: `ETABLISSEMENT ${faker.random.word()}`.toUpperCase(),
    historique_statut_apprenant: [],
    statut_apprenant: getRandomStatutApprenant(),
    date_metier_mise_a_jour_statut: faker.date.past(),
    periode_formation: isStudentPresent ? periode_formation : [],
    annee_formation: getRandomAnneeFormation(),
    annee_scolaire,
    id_erp_apprenant: faker.datatype.uuid(),
    tel_apprenant: faker.datatype.boolean() ? faker.phone.number() : null,
    code_commune_insee_apprenant: faker.address.zipCode("#####"),
    date_de_naissance_apprenant: getRandomDateNaissance(),
    ...(isContratPresent ? { contrat_date_debut: getRandomDateDebutContrat() } : {}),
    ...(isContratPresent ? { contrat_date_fin: getRandomDateFinContrat() } : {}),
    ...(isContratPresent && faker.datatype.boolean() ? { contrat_date_rupture: getRandomDateRuptureContrat() } : {}),
    ...(faker.datatype.boolean() ? { formation_rncp: getRandomRncpFormation() } : {}),
    source: faker.random.word(),
    ...params,
  };
};

export const createRandomEffectifApprenant = (params = {}) => {
  const annee_scolaire = getRandomAnneeScolaire();
  const periode_formation = getRandomPeriodeFormation(annee_scolaire);
  const isStudentPresent = isPresent();
  const { uai } = getRandomEtablissement();

  return {
    dossierApprenantId: faker.datatype.uuid(),
    uai_etablissement: uai,
    nom_etablissement: `ETABLISSEMENT ${faker.random.word()}`.toUpperCase(),
    formation_cfd: getRandomFormationCfd(),
    periode_formation: isStudentPresent ? periode_formation : null,
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

export const createSampleEffectif = (params = {}) => {
  const annee_scolaire = getRandomAnneeScolaire();
  return {
    apprenant: {
      ine_apprenant: getRandomIne(),
      nom: faker.name.lastName().toUpperCase(),
      prenom: faker.name.firstName(),
      email_contact: faker.internet.email(),
      date_de_naissance_apprenant: getRandomDateNaissance().toISOString().slice(0, -5),
      ...params?.apprenant,
    },
    formation: {
      annee_formation: getRandomAnneeFormation(),
      cfd: getRandomFormationCfd(),
      periode: getRandomPeriodeFormation(annee_scolaire),
      rncp: getRandomRncpFormation(),
      libelle_long: faker.helpers.arrayElement(sampleLibelles).intitule_long,
      niveau: "5",
      niveau_libelle: "5 (BTS, DUT...)",
      annee: getRandomAnneeFormation(),
      ...params?.formation,
    },
    validation_errors: [],
    created_at: new Date(),
    updated_at: new Date(),
    id_erp_apprenant: faker.datatype.uuid(),
    source: faker.random.word(),
    annee_scolaire,
    organisme_id: null,
    ...params,
  };
};

// random DossierApprenant shaped along our REST API schema
export const createRandomDossierApprenantApiInput = (params = {}) => {
  const annee_scolaire = getRandomAnneeScolaire();
  const periode_formation = getRandomPeriodeFormation(annee_scolaire);
  const isStudentPresent = isPresent();
  const { uai, siret } = getRandomEtablissement();

  return {
    ine_apprenant: getRandomIne(),
    nom_apprenant: faker.name.lastName().toUpperCase(),
    prenom_apprenant: faker.name.firstName(),
    date_de_naissance_apprenant: getRandomDateNaissance().toISOString().slice(0, -5),

    email_contact: faker.internet.email(),

    id_formation: getRandomFormationCfd(),
    libelle_long_formation: faker.helpers.arrayElement(sampleLibelles).intitule_long,
    uai_etablissement: uai,
    siret_etablissement: siret,
    nom_etablissement: `ETABLISSEMENT ${faker.random.word()}`.toUpperCase(),

    statut_apprenant: getRandomStatutApprenant(),
    date_metier_mise_a_jour_statut: faker.date.past().toISOString(),
    annee_formation: getRandomAnneeFormation(),
    periode_formation: isStudentPresent ? periode_formation.join("-") : "",
    annee_scolaire,
    id_erp_apprenant: faker.datatype.uuid(),
    tel_apprenant: faker.datatype.boolean() ? faker.phone.number() : null,
    code_commune_insee_apprenant: faker.address.zipCode(),

    ...params,
  };
};

const createRandomListOf =
  (generateItem) =>
  (nbItems = 0, params) => {
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
