import { faker } from "@faker-js/faker/locale/fr";
import merge from "lodash-es/merge";
import { WithId } from "mongodb";
import RandExp from "randexp";
import type { PartialDeep } from "type-fest";

import { addEffectifComputedFields } from "@/common/actions/effectifs.actions";
import { CODES_STATUT_APPRENANT } from "@/common/constants/dossierApprenant";
import { CFD_REGEX, INE_REGEX, RNCP_REGEX } from "@/common/constants/validations";
import { Effectif, Organisme } from "@/common/model/@types";
import { DossierApprenantSchemaV1V2ZodType } from "@/common/validation/dossierApprenantSchemaV1V2";

import sampleEtablissements from "./sampleEtablissements";
import { sampleLibelles } from "./sampleLibelles";

const isPresent = () => Math.random() < 0.66;
const getRandomIne = () => new RandExp(INE_REGEX).gen().toUpperCase();
const getRandomFormationCfd = () => new RandExp(CFD_REGEX).gen().toUpperCase();
const getRandomRncpFormation = () => new RandExp(RNCP_REGEX).gen();
const getRandomEtablissement = (siret?: string) =>
  siret ? sampleEtablissements[siret] : faker.helpers.arrayElement(Object.values(sampleEtablissements));
const getRandomStatutApprenant = () => faker.helpers.arrayElement(Object.values(CODES_STATUT_APPRENANT));
const getRandomFormation = (annee_scolaire: string) => {
  return {
    cfd: getRandomFormationCfd(),
    periode: getRandomPeriodeFormation(annee_scolaire),
    rncp: getRandomRncpFormation(),
    libelle_court: faker.helpers.arrayElement(sampleLibelles).intitule_court,
    libelle_long: faker.helpers.arrayElement(sampleLibelles).intitule_long,
    niveau: "5",
    niveau_libelle: "5 (BTS, DUT...)",
    annee: getRandomAnneeFormation(),
  };
};

const getRandomPeriodeFormation = (anneeScolaire): [number, number] => {
  const yearToInclude = Number(anneeScolaire.slice(0, 4));
  const startYear = faker.helpers.arrayElement<number>([yearToInclude, yearToInclude - 1, yearToInclude - 2]);
  const endYear = startYear + faker.helpers.arrayElement<number>([1, 2]);
  return [startYear, endYear];
};
const getRandomAnneeFormation = () => faker.helpers.arrayElement([0, 1, 2, 3]);
const getRandomAnneeScolaire = () => {
  const currentYear = new Date().getFullYear();
  const anneeScolaire = faker.helpers.arrayElement([
    [currentYear - 1, currentYear],
    [currentYear, currentYear + 1],
    [currentYear + 1, currentYear + 2],
  ]);
  return anneeScolaire.join("-");
};
const getRandomDateNaissance = () => faker.date.birthdate({ min: 18, max: 25, mode: "age" });

export const createRandomOrganisme = (params: any = {}) => {
  const { ...etablissement } = getRandomEtablissement(params?.siret);
  return {
    ...etablissement,
    ...params,
  };
};

export const createSampleEffectif = ({
  organisme,
  ...params
}: PartialDeep<Effectif & { organisme: WithId<Organisme> }> = {}): Effectif => {
  const annee_scolaire = getRandomAnneeScolaire();

  return merge(
    {
      apprenant: {
        ine: getRandomIne(),
        nom: faker.name.lastName().toUpperCase(),
        prenom: faker.name.firstName(),
        courriel: faker.internet.email(),
        date_de_naissance: getRandomDateNaissance(),
        historique_statut: [],
      },
      contrats: [],
      formation: getRandomFormation(annee_scolaire),
      validation_errors: [],
      created_at: new Date(),
      updated_at: new Date(),
      id_erp_apprenant: faker.datatype.uuid(),
      source: faker.random.word(),
      annee_scolaire,
      organisme_id: organisme?._id,
      _computed: organisme ? addEffectifComputedFields(organisme as Organisme) : {},
    } as Effectif,
    params
  );
};

export const createRandomDossierApprenantApiInput = (
  params: Partial<DossierApprenantSchemaV1V2ZodType> = {}
): DossierApprenantSchemaV1V2ZodType => {
  const isStudentPresent = isPresent();
  const annee_scolaire = getRandomAnneeScolaire();
  const { uai, siret } = getRandomEtablissement();
  const formation = getRandomFormation(annee_scolaire);

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
    annee_formation: formation.annee,
    periode_formation: isStudentPresent ? formation.periode.join("-") : null,
    annee_scolaire,
    id_erp_apprenant: faker.datatype.uuid(),
    tel_apprenant: faker.helpers.arrayElement([faker.phone.number(), undefined]),
    code_commune_insee_apprenant: faker.address.zipCode(),
    source: "userApi",
    api_version: "v2",
    ...params,
  };
};
