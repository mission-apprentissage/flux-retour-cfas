import { faker } from "@faker-js/faker/locale/fr";
import { addYears, subMonths } from "date-fns";
import merge from "lodash-es/merge";
import { WithId } from "mongodb";
import RandExp from "randexp";
import type { PartialDeep } from "type-fest";

import { addEffectifComputedFields } from "@/common/actions/effectifs.actions";
import { CODES_STATUT_APPRENANT, SEXE_APPRENANT_ENUM } from "@/common/constants/dossierApprenant";
import { CFD_REGEX, CODE_NAF_REGEX, INE_REGEX, RNCP_REGEX, SIRET_REGEX } from "@/common/constants/validations";
import { Effectif, Organisme } from "@/common/model/@types";
import { stripEmptyFields } from "@/common/utils/miscUtils";
import { DossierApprenantSchemaV1V2ZodType } from "@/common/validation/dossierApprenantSchemaV1V2";
import { DossierApprenantSchemaV3ZodType } from "@/common/validation/dossierApprenantSchemaV3";

import sampleEtablissements from "./sampleEtablissements";
import { sampleLibelles } from "./sampleLibelles";

const isPresent = () => Math.random() < 0.66;
const getRandomIne = () => new RandExp(INE_REGEX).gen().toUpperCase();
const getRandomFormationCfd = () => new RandExp(CFD_REGEX).gen().toUpperCase();
const getRandomRncpFormation = () => new RandExp(RNCP_REGEX).gen();
const getRandomSiret = () => new RandExp(SIRET_REGEX).gen();
const getRandomCodeNAF = () => new RandExp(CODE_NAF_REGEX).gen();
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
const getRandomContrat = () => {
  const date_rupture_contrat = getRandomDateRuptureContrat();
  const cause_rupture_contrat = date_rupture_contrat ? getRandomCauseRuptureContrat() : undefined;

  return {
    date_debut: getRandomDateDebutContrat(),
    date_fin: getRandomDateFinContrat(),
    date_rupture: getRandomDateRuptureContrat(),
    cause_rupture: cause_rupture_contrat,
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
const getRandomDateDebutContrat = () => faker.date.between(subMonths(new Date(), 6), subMonths(new Date(), 1));
const getRandomDateFinContrat = () => faker.date.between(addYears(new Date(), 1), addYears(new Date(), 2));
const getRandomDateRuptureContrat = () => faker.date.between(subMonths(new Date(), 1), addYears(new Date(), 2));
const getRandomDateExclusion = () => faker.date.between(subMonths(new Date(), 1), addYears(new Date(), 2));
const getRandomCauseRuptureContrat = () =>
  faker.helpers.arrayElement([
    "démission",
    "résiliation",
    "force majeure",
    "obtention du diplôme",
    "faute lourde",
    "inaptitude constatée par la médecine du travail",
  ]);
const getRandomCauseExclusion = () =>
  faker.helpers.arrayElement(["démission", "résiliation", "force majeure", "faute lourde"]);
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
    ...params,
  };
};

export const createRandomDossierApprenantApiV3Input = (
  params: PartialDeep<DossierApprenantSchemaV3ZodType> = {}
): DossierApprenantSchemaV3ZodType => {
  const annee_scolaire = getRandomAnneeScolaire();
  const isStudentPresent = isPresent();
  const etablissement_formateur = getRandomEtablissement();
  const etablissement_responsable = getRandomEtablissement();
  const rqth = faker.datatype.boolean();
  const randomFormation = getRandomFormation(annee_scolaire);
  const randomContrat = getRandomContrat();
  const date_exclusion = getRandomDateExclusion();

  return stripEmptyFields({
    source: "userApi",
    apprenant: {
      nom: faker.name.lastName(),
      prenom: faker.name.firstName(),
      date_de_naissance: getRandomDateNaissance().toISOString().slice(0, -5),
      statut: getRandomStatutApprenant(),
      date_metier_mise_a_jour_statut: faker.date.past().toISOString(),
      id_erp: faker.datatype.uuid(),
      // V1 - OPTIONAL FIELDS
      ine: getRandomIne(),
      email: faker.internet.email(),
      telephone: faker.helpers.arrayElement([faker.phone.number(), undefined]),
      code_commune_insee: faker.address.zipCode(),
      // V3 - OPTIONAL FIELDS
      sexe: faker.helpers.arrayElement([...SEXE_APPRENANT_ENUM, undefined]),
      rqth,
      date_rqth: rqth ? faker.date.past().toISOString().slice(0, -5) : undefined,
      ...params?.apprenant,
    },
    etablissement_responsable: {
      siret: etablissement_responsable.siret,
      uai: etablissement_responsable.uai,
      nom: etablissement_responsable.nom,
      ...params?.etablissement_responsable,
    },
    etablissement_formateur: {
      siret: etablissement_formateur.siret,
      uai: etablissement_formateur.uai,
      nom: etablissement_formateur.nom,
      code_commune_insee: faker.address.zipCode(),
      ...params?.etablissement_formateur,
    },
    formation: {
      code_cfd: randomFormation.cfd,
      code_rncp: randomFormation.rncp,
      periode: isStudentPresent ? randomFormation.periode.join("-") : undefined,
      libelle_long: randomFormation.libelle_long,
      annee: randomFormation.annee,
      annee_scolaire,
      // V3 - REQUIRED FIELDS
      date_inscription: faker.date.past().toISOString(),
      date_entree: faker.date.past().toISOString(),
      date_fin: faker.date.future().toISOString(),
      // V3 - OPTIONAL FIELDS
      obtention_diplome: faker.datatype.boolean(),
      date_obtention_diplome: faker.date.past().toISOString(),
      date_exclusion: date_exclusion ? date_exclusion.toISOString() : undefined,
      cause_exclusion: date_exclusion ? getRandomCauseExclusion() : undefined,
      ...params?.formation,
      referent_handicap: {
        nom: faker.name.lastName(),
        prenom: faker.name.firstName(),
        email: faker.internet.email(),
        ...params?.formation?.referent_handicap,
      },
    },
    contrat: {
      date_debut: randomContrat.date_debut.toISOString(),
      date_fin: randomContrat.date_fin.toISOString(),
      date_rupture: randomContrat.date_rupture.toISOString(),
      // V3 - OPTIONAL FIELDS
      cause_rupture: randomContrat.cause_rupture,
      ...params?.contrat,
    },
    employeur: {
      siret: getRandomSiret(),
      code_commune_insee: faker.address.zipCode(),
      code_naf: getRandomCodeNAF(),
      ...params?.employeur,
    },
  });
};
