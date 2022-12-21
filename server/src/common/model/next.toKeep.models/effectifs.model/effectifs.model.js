import { object, objectId, string, date, boolean, arrayOf } from "../../json-schema/jsonSchemaTypes.js";
import { apprenantSchema, defaultValuesApprenant, validateApprenant } from "./parts/apprenant.part.js";

import { effectifFieldsLockerSchema, defaultValuesEffectifFieldsLocker } from "./parts/effectif.field.locker.part.js";
import { defaultValuesFormationEffectif, formationEffectifSchema } from "./parts/formation.effectif.part.js";

export const collectionName = "effectifs";

export const schema = object(
  {
    _id: objectId(),
    organisme_id: objectId({
      description: "Organisme id",
    }),
    id_erp_apprenant: string({ description: "Identifiant de l'apprenant dans l'erp" }),
    source: string({
      description: "Source du dossier apprenant (Ymag, Gesti, TDB_MANUEL, TDB_FILE...)",
    }), // TODO [tech] ENUM

    annee_scolaire: string({
      description: `Année scolaire sur laquelle l'apprenant est enregistré (ex: "2020-2021")`,
      pattern: "^\\d{4}-\\d{4}$",
    }),

    apprenant: apprenantSchema,
    formation: formationEffectifSchema,

    is_lock: effectifFieldsLockerSchema,
    updated_at: date({ description: "Date de mise à jour en base de données" }),
    created_at: date({ description: "Date d'ajout en base de données" }),
    archive: boolean({ description: "Dossier apprenant est archivé (rétention maximum 5 ans)" }),
    validation_errors: arrayOf(
      object({
        fieldName: string({ description: "Nom du champ en erreur" }),
        type: string({ description: "Type d'erreur" }),
        inputValue: string({ description: "Valeur fournie en entrée" }),
        message: string({ description: "Message de l'erreur" }),
      }),
      {
        description: "Erreurs de validation de cet effectif",
      }
    ),
  },
  {
    required: ["apprenant", "id_erp_apprenant", "organisme_id", "source", "annee_scolaire"],
    additionalProperties: true,
  }
);

// Default value
export function defaultValuesEffectif({ lockAtCreate = false }) {
  return {
    apprenant: defaultValuesApprenant(),
    formation: defaultValuesFormationEffectif(),
    is_lock: defaultValuesEffectifFieldsLocker(lockAtCreate),
    validation_errors: [],
    updated_at: new Date(),
    created_at: new Date(),
  };
}

// TODO Extra validation
export function validateEffectif(props) {
  return {
    ...props,
    apprenant: validateApprenant(props.apprenant),
  };
}
