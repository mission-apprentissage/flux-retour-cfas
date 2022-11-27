import { object, objectId, string, date, boolean } from "../../json-schema/jsonSchemaTypes.js";
import { apprenantSchema, defaultValuesApprenant, validateApprenant } from "./parts/apprenant.part.js";

import { effectifFieldsLockerSchema, defaultValuesEffectifFieldsLocker } from "./parts/effectif.field.locker.part.js";
import { defaultValuesFormation, formationSchema } from "./parts/formation.part.js";

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
    formation: formationSchema,

    is_lock: effectifFieldsLockerSchema,
    updated_at: date({ description: "Date de mise à jour en base de données" }),
    created_at: date({ description: "Date d'ajout en base de données" }),
    archive: boolean({ description: "Dossier apprenant est archivé (retnetion maximum 5 ans)" }),
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
    formation: defaultValuesFormation(),
    is_lock: defaultValuesEffectifFieldsLocker(lockAtCreate),
    updated_at: new Date(),
    created_at: new Date(),
  };
}

// TODO Extra validation
export function validateEffectif(props) {
  validateApprenant(props.apprenant);
}
