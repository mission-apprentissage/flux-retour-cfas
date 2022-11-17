import { contratSchema } from "./blocks/contrat/contratSchema";
import { formationSchema } from "./blocks/formation/formationSchema";
import { maitreSchema } from "./blocks/maitre/maitreSchema";
import { apprentiSchema } from "./blocks/apprenti/apprentiSchema";
import { employerSchema } from "./blocks/employer/employerSchema";
import { cerfaSchema } from "../formEngine/cerfaSchema";
import { getValues } from "../formEngine/utils/getValues";
import { isEmptyValue } from "../formEngine/utils/isEmptyValue";

export const getFormStatus = ({ fields, values }) => {
  const formErrors = getBlocErrors({ fields, values });

  const contratStatus = getContratCompletion(fields, "contrat", formErrors);
  const formationStatus = getBlocCompletion(Object.keys(formationSchema), fields, "formation", formErrors);
  const maitreStatus = getBlocCompletion(Object.keys(maitreSchema), fields, "maitre", formErrors);
  const apprentiStatus = getBlocCompletion(Object.keys(apprentiSchema), fields, "apprenti", formErrors);
  const employeurStatus = getBlocCompletion(Object.keys(employerSchema), fields, "employeur", formErrors);

  const cerfaTabCompletion =
    (contratStatus.completion +
      formationStatus.completion +
      maitreStatus.completion +
      apprentiStatus.completion +
      employeurStatus.completion) /
    5;

  return {
    contrat: contratStatus,
    formation: formationStatus,
    maitre: maitreStatus,
    apprenti: apprentiStatus,
    employeur: employeurStatus,
    complete: cerfaTabCompletion === 100,
    completion: cerfaTabCompletion,
    global: {
      errors: formErrors.reduce((acc, er) => ({ ...acc, [er.target]: er }), {}),
    },
  };
};

const getContratCompletion = (fields, values, formErrors) => {
  const requiredFieldNames = getRequiredFieldNames(Object.keys(contratSchema), fields);
  const invalidFields = getInvalidFields(requiredFieldNames, fields);
  const completion = calcCompletion({
    nbRequired: requiredFieldNames.length,
    nbBlocErrors: formErrors.filter((error) => error.target === "avantageNature").length,
    nbFieldErrors: invalidFields.length,
  });
  return {
    fieldErrors: invalidFields,
    complete: completion === 100,
    completion,
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

const getBlocErrors = ({ fields, values }) => {
  const blockErrors = [];
  cerfaSchema.logics.forEach((logic) => {
    if (!logic.target) return;
    const { error } = logic.process({ values, fields }) ?? {};
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
