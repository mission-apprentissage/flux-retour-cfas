import { object, boolean } from "../../../json-schema/jsonSchemaTypes.js";

const adresseLocker = object({
  numero: boolean(),
  repetition_voie: boolean(),
  voie: boolean(),
  complement: boolean(),
  code_postal: boolean(),
  code_insee: boolean(),
  commune: boolean(),
  departement: boolean(),
  region: boolean(),
  academie: boolean(),
  complete: boolean(),
});

export const effectifFieldsLockerSchema = object({
  apprenant: object({
    ine: boolean(),
    nom: boolean(),
    prenom: boolean(),
    sexe: boolean(),
    date_de_naissance: boolean(),
    nationalite: boolean(),
    handicap: boolean(),
    courriel: boolean(),
    telephone: boolean(),
    adresse: adresseLocker,
    historique_statut: boolean(),
    contrats: boolean(),
  }),
  formation: object({
    cfd: boolean(),
    rncp: boolean(),
    libelle_long: boolean(),
    niveau: boolean(),
    niveau_libelle: boolean(),
    periode: boolean(),
    annee: boolean(),
  }),
});

const defaultAdresseLock = (lockAtCreate = false) => ({
  numero: lockAtCreate,
  repetition_voie: lockAtCreate,
  voie: lockAtCreate,
  complement: lockAtCreate,
  code_postal: lockAtCreate,
  code_insee: lockAtCreate,
  commune: lockAtCreate,
  departement: lockAtCreate,
  region: lockAtCreate,
  academie: lockAtCreate,
  complete: lockAtCreate,
});

// Default value
export function defaultValuesEffectifFieldsLocker(lockAtCreate = false) {
  return {
    apprenant: {
      ine: lockAtCreate,
      nom: lockAtCreate,
      prenom: lockAtCreate,
      sexe: lockAtCreate,
      date_de_naissance: lockAtCreate,
      nationalite: lockAtCreate,
      handicap: lockAtCreate,
      courriel: lockAtCreate,
      telephone: lockAtCreate,
      adresse: defaultAdresseLock(lockAtCreate),
      historique_statut: lockAtCreate,
      contrats: lockAtCreate,
    },
    formation: {
      cfd: lockAtCreate,
      rncp: lockAtCreate,
      libelle_long: lockAtCreate,
      niveau: lockAtCreate,
      niveau_libelle: lockAtCreate,
      periode: lockAtCreate,
      annee: lockAtCreate,
    },
  };
}
