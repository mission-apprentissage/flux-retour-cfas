import { object, boolean } from "../../../json-schema/jsonSchemaTypes.js";

export const fieldLockedSchema = () => {
  return object({
    employeur: object({
      siret: boolean(),
      denomination: boolean(),
      raison_sociale: boolean(),
      naf: boolean(),
      nombreDeSalaries: boolean(),
      codeIdcc: boolean(),
      libelleIdcc: boolean(),
      telephone: boolean(),
      courriel: boolean(),
      adresse: object({
        numero: boolean(),
        repetition_voie: boolean(),
        voie: boolean(),
        complement: boolean(),
        code_postal: boolean(),
        commune: boolean(),
        // departement: boolean(),
        // region: boolean(),
      }),
      nom: boolean(),
      prenom: boolean(),
      typeEmployeur: boolean(),
      employeurSpecifique: boolean(),
    }),
  });
};

// Default value
export function defaultValuesFieldLocked() {
  return {
    employeur: {
      siret: false,
      denomination: true,
      raison_sociale: false,
      naf: true,
      nombreDeSalaries: true,
      codeIdcc: true,
      libelleIdcc: true,
      telephone: false,
      courriel: false,
      adresse: {
        numero: true,
        repetition_voie: true,
        voie: true,
        complement: true,
        code_postal: true,
        commune: true,
        // departement: true,
        // region: true,
      },
      nom: false,
      prenom: false,
      typeEmployeur: false,
      employeurSpecifique: false,
    },
  };
}
