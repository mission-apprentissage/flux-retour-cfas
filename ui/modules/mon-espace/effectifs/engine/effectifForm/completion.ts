import { effectifFormSchema } from "@/modules/mon-espace/effectifs/engine/formEngine/effectifFormSchema";
import { getValues } from "@/modules/mon-espace/effectifs/engine/formEngine/utils/getValues";
import { isEmptyValue } from "@/modules/mon-espace/effectifs/engine/formEngine/utils/isEmptyValue";

import { apprenantSchema } from "./blocks/apprenant/apprenantSchema";

export const getFormStatus = ({ fields, values }) => {
  const formErrors = getBlocErrors({ fields, values });
  const apprenantStatus = getBlocCompletion(Object.keys(apprenantSchema), fields, "apprenant", formErrors);

  const effectifFormTabCompletion = apprenantStatus.completion;

  return {
    // contrat: contratStatus,
    // formation: formationStatus,
    // maitre: maitreStatus,
    // apprenti: apprentiStatus,
    // employeur: employeurStatus,
    apprenant: apprenantStatus,
    complete: effectifFormTabCompletion === 100,
    completion: effectifFormTabCompletion,
    global: {
      errors: formErrors.reduce((acc, er) => ({ ...acc, [er.target]: er }), {}),
    },
  };
};

const getBlocCompletion = (fieldNames, fields, blocName, formErrors) => {
  const requiredFieldNames = getRequiredFieldNames(fieldNames, fields);
  const invalidFields = getInvalidFields(requiredFieldNames, fields);

  const completion = calcCompletion({
    nbRequired: requiredFieldNames.length,
    nbBlocErrors: formErrors.filter((error) => error.blocCompletion === blocName).length,
    nbFieldErrors: invalidFields.length,
  });

  return {
    fieldErrors: invalidFields,
    complete: completion === 100,
    completion,
  };
};

const calcCompletion = ({ nbRequired, nbFieldErrors, nbBlocErrors }) =>
  Math.round(((nbRequired - nbFieldErrors) / (nbRequired + nbBlocErrors)) * 100);

const getRequiredFieldNames = (fieldNames, fields) => {
  const values = getValues(fields);
  return fieldNames.filter((current) => {
    if (current.includes("[]")) return false;
    const field = fields[current];
    if (!field) return false;
    if (field.completion === false) return false;
    if (field.completion) {
      return field.completion?.({ values });
    }
    return field.required;
  });
};

const getBlocErrors = ({ fields, values }: { fields?: any; values?: any }) => {
  const blockErrors: any[] = [];
  effectifFormSchema.logics.forEach((logic: any) => {
    if (!logic.target) return;
    const { error }: any = logic.process({ values }) ?? {};
    if (error) {
      blockErrors.push({
        target: logic.target,
        error,
        blocCompletion: logic.blocCompletion,
        deps: logic.deps,
        touched: logic.deps.some((dep) => fields[dep].touched),
      });
    }
  });
  return blockErrors;
};

const getInvalidFields = (fieldNames, fields) => {
  return fieldNames
    .filter((name) => {
      const field = fields[name];
      if (!field) return false;
      return isEmptyValue(field.value) || !field.success || field.error;
    })
    .map((name) => fields[name]);
};
