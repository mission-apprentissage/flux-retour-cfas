import { faker } from "@faker-js/faker/locale/fr";
import merge from "lodash-es/merge";
import { ObjectId, WithoutId } from "mongodb";
import RandExp from "randexp";
import { CODES_STATUT_APPRENANT, CFD_REGEX, INE_REGEX, RNCP_REGEX, SOURCE_APPRENANT } from "shared";
import { IEffectif } from "shared/models/data/effectifs.model";
import { IOrganisme } from "shared/models/data/organismes.model";
import type { PartialDeep } from "type-fest";

import { addComputedFields } from "@/common/actions/effectifs.actions";
import { DossierApprenantSchemaV1V2ZodType } from "@/common/validation/dossierApprenantSchemaV1V2";

import sampleEtablissements, { SampleEtablissement } from "./sampleEtablissements";
import { sampleLibelles } from "./sampleLibelles";

export const getRandomSourceOrganismeId = () => new ObjectId().toString();

const getRandomIne = () => new RandExp(INE_REGEX).gen().toUpperCase();
const getRandomFormationCfd = () => new RandExp(CFD_REGEX).gen().toUpperCase();
const getRandomRncpFormation = () => new RandExp(RNCP_REGEX).gen();
const getRandomEtablissement = (siret?: string): SampleEtablissement =>
  siret ? sampleEtablissements[siret] : faker.helpers.arrayElement(Object.values(sampleEtablissements));
const getRandomStatutApprenant = () => faker.helpers.arrayElement(Object.values(CODES_STATUT_APPRENANT));
const getRandomDateInRange = (start: Date, end: Date): Date => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const addMonthsToDate = (date: Date, months: number): Date => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};
export const createRandomFormation = (annee_scolaire: string, dateEntreeParam?: Date, dateFinParam?: Date) => {
  const [startYear] = annee_scolaire.split("-").map(Number);
  const dateInscriptionStart = new Date(startYear, 6, 1);
  const dateInscriptionEnd = new Date(startYear, 8, 30);

  // Use provided dates or generate random dates if not provided
  const dateInscription = dateEntreeParam || getRandomDateInRange(dateInscriptionStart, dateInscriptionEnd);
  const dateEntree = dateEntreeParam || getRandomDateInRange(dateInscription, new Date(startYear, 9, 30));
  const durations = [24, 36, 48];
  const duree_theorique_mois = faker.helpers.arrayElement(durations);
  const dateFin = dateFinParam || addMonthsToDate(dateEntree, duree_theorique_mois);

  return {
    cfd: getRandomFormationCfd(),
    periode: getRandomPeriodeFormation(annee_scolaire),
    rncp: getRandomRncpFormation(),
    libelle_court: faker.helpers.arrayElement(sampleLibelles).intitule_court,
    libelle_long: faker.helpers.arrayElement(sampleLibelles).intitule_long,
    niveau: "5",
    niveau_libelle: "5 (BTS, DUT...)",
    annee: getRandomAnneeFormation(),
    duree_theorique_mois: duree_theorique_mois,
    date_inscription: dateInscription,
    date_entree: dateEntree,
    date_fin: dateFin,
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

export const createRandomOrganisme = (params: Partial<IOrganisme> = {}): WithoutId<IOrganisme> => {
  const { ...etablissement } = getRandomEtablissement(params?.siret);
  return {
    ...etablissement,
    ...params,
    created_at: new Date(),
    updated_at: new Date(),
  };
};

export const createSampleEffectif = async ({
  organisme,
  ...params
}: PartialDeep<IEffectif & { organisme: IOrganisme }> = {}): Promise<WithoutId<IEffectif>> => {
  const annee_scolaire = getRandomAnneeScolaire();
  const formation = createRandomFormation(annee_scolaire);

  let baseEffectif: PartialDeep<IEffectif> = {
    apprenant: {
      ine: getRandomIne(),
      nom: faker.person.lastName().toUpperCase(),
      prenom: faker.person.firstName(),
      courriel: faker.internet.email(),
      date_de_naissance: getRandomDateNaissance(),
      historique_statut: [],
    },
    contrats: [],
    formation: formation,
    validation_errors: [],
    created_at: new Date(),
    updated_at: new Date(),
    id_erp_apprenant: faker.string.uuid(),
    source: SOURCE_APPRENANT.FICHIER,
    source_organisme_id: faker.string.uuid(),
    annee_scolaire,
    organisme_id: organisme?._id,
  };

  let computedFields = await addComputedFields({
    organisme: organisme as IOrganisme,
    effectif: merge({}, baseEffectif, params) as IEffectif,
    certification: null,
  });

  let fullEffectif = merge({}, baseEffectif, params, {
    _computed: computedFields,
  });

  return fullEffectif as WithoutId<IEffectif>;
};

export const createRandomDossierApprenantApiInput = (
  params: Partial<DossierApprenantSchemaV1V2ZodType> = {}
): DossierApprenantSchemaV1V2ZodType => {
  const annee_scolaire = getRandomAnneeScolaire();
  const { uai, siret } = getRandomEtablissement();
  const formation = createRandomFormation(annee_scolaire);

  return {
    ine_apprenant: getRandomIne(),
    nom_apprenant: faker.person.lastName().toUpperCase(),
    prenom_apprenant: faker.person.firstName(),
    date_de_naissance_apprenant: getRandomDateNaissance().toISOString().slice(0, -5),

    email_contact: faker.internet.email(),

    id_formation: getRandomFormationCfd(),
    libelle_long_formation: faker.helpers.arrayElement(sampleLibelles).intitule_long,
    uai_etablissement: uai,
    siret_etablissement: siret,
    nom_etablissement: `ETABLISSEMENT ${faker.lorem.word()}`.toUpperCase(),

    statut_apprenant: getRandomStatutApprenant(),
    date_metier_mise_a_jour_statut: faker.date.past().toISOString(),
    annee_formation: formation.annee,
    periode_formation: formation.periode.join("-"),
    annee_scolaire,
    id_erp_apprenant: faker.string.uuid(),
    tel_apprenant: faker.helpers.arrayElement([faker.phone.number(), undefined]),
    code_commune_insee_apprenant: faker.location.zipCode(),
    source: SOURCE_APPRENANT.ERP,
    api_version: "v2",
    ...params,
  };
};
