import { uniqBy } from "lodash-es";
import { schemaValidation } from "../../utils/schemaUtils";
import { object, objectId, string, date, boolean, arrayOf } from "../json-schema/jsonSchemaTypes";
import { apprenantSchema, defaultValuesApprenant, validateApprenant } from "./parts/apprenant.part";

import { effectifFieldsLockerSchema, defaultValuesEffectifFieldsLocker } from "./parts/effectif.field.locker.part";
import {
  defaultValuesFormationEffectif,
  formationEffectifSchema,
  validateFormationEffectif,
} from "./parts/formation.effectif.part";

const collectionName = "effectifs";

const indexes = () => {
  return [
    [
      {
        organisme_id: 1,
        annee_scolaire: 1,
        id_erp_apprenant: 1,
        "apprenant.nom": 1,
        "apprenant.prenom": 1,
        "formation.cfd": 1,
      },
      { unique: true },
    ],
  ];
};

export const schema = object(
  {
    _id: objectId(),
    organisme_id: objectId({
      description: "Organisme id",
    }),
    id_erp_apprenant: string({ description: "Identifiant de l'apprenant dans l'erp" }),
    source: string({
      description: "Source du dossier apprenant (Ymag, Gesti, TDB_MANUEL, TDB_FILE...)",
    }),

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
export function validateEffectif(props, getErrors = false) {
  if (getErrors) {
    const errorsApprenant = validateApprenant(props.apprenant, getErrors);
    const errorsFormation = validateFormationEffectif(props.formation, getErrors);
    const entityValidation = schemaValidation({
      entity: props,
      schema,
      getErrors,
    });
    return uniqBy([...entityValidation, ...errorsApprenant, ...errorsFormation], "fieldName");
  }

  return schemaValidation({
    entity: {
      ...props,
      apprenant: validateApprenant(props.apprenant, getErrors),
      formation: validateFormationEffectif(props.formation, getErrors),
    },
    schema,
    getErrors,
  });
}

export default { schema, indexes, collectionName };
