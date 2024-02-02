import { Effectif } from "shared/models/data/@types";
import { PartialDeep } from "type-fest";

import { defaultValuesApprenant } from "./parts/apprenant.part";
import { defaultValuesEffectifFieldsLocker } from "./parts/effectif.field.locker.part";
import { defaultValuesFormationEffectif } from "./parts/formation.effectif.part";

// Default value
export function defaultValuesEffectif() {
  return {
    apprenant: defaultValuesApprenant(),
    contrats: [],
    formation: defaultValuesFormationEffectif(),
    is_lock: defaultValuesEffectifFieldsLocker(),
    validation_errors: [],
    _computed: {},
    updated_at: new Date(),
    created_at: new Date(),
  } satisfies PartialDeep<Effectif>;
}
