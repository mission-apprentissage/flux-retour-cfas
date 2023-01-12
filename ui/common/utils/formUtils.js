import { DateTime } from "luxon";
import { _post } from "../httpClient";

export const convertValueToOption = (field) => {
  let valueOpt = "";
  let valueDb = field.value;
  for (let i = 0; i < field.options.length; i++) {
    const options = field.options[i];
    if (options.value === field.value) {
      valueOpt = options.label;
    }
  }
  return {
    ...field,
    value: valueOpt,
    valueDb,
  };
};

export const convertValueToMultipleSelectOption = (field) => {
  let valueOpt = "";
  let valueDb = field.value;
  for (let i = 0; i < field.options.length; i++) {
    const options = field.options[i];
    for (let j = 0; j < options.options.length; j++) {
      const option = options.options[j];
      if (option.value === field.value) {
        valueOpt = option.label;
      }
    }
  }
  return {
    ...field,
    value: valueOpt,
    valueDb,
  };
};

export const convertValueToDate = (field) => {
  return {
    ...field,
    value: field.value ? DateTime.fromISO(field.value).setLocale("fr-FR").toFormat("yyyy-MM-dd") : field.value,
    valueDb: field.value,
  };
};

//

export const convertOptionToValue = (field) => {
  if (!field) return null;
  let value = null;
  for (let i = 0; i < field.options.length; i++) {
    const options = field.options[i];
    if (options.label === field.value) {
      value = options.value;
    }
  }
  return value;
};

export const convertMultipleSelectOptionToValue = (field) => {
  let value = null;
  for (let i = 0; i < field.options.length; i++) {
    const options = field.options[i];
    for (let j = 0; j < options.options.length; j++) {
      const option = options.options[j];
      if (option.label === field.value) {
        value = option.value;
      }
    }
  }
  return value;
};

export const convertDateToValue = (field) => {
  return DateTime.fromISO(field.value).setLocale("fr-FR").toISO();
};

//

export const fieldCompletionPercentage = (fields, nbFields) => {
  const keys = Object.keys(fields);
  let countFilledField = 0;
  for (let index = 0; index < keys.length; index++) {
    const field = fields[keys[index]];
    if (field?.value !== "") {
      countFilledField++;
    }
  }
  const percent = (countFilledField * 100) / nbFields;
  return percent;
};

//

export const isAgeInValidLowerAtDate = ({ dateNaissance, age, dateString, limitAge = 15, label = "" }) => {
  if (age === limitAge - 1 && dateString !== "") {
    const dateObj = DateTime.fromISO(dateString).setLocale("fr-FR");
    const anniversaireA1 = dateNaissance.plus({ years: age + 1 });
    if (dateObj < anniversaireA1) {
      return {
        successed: false,
        data: null,
        message: label,
      };
    }
  }
  return false;
};

export const caclAgeAtDate = (dateNaissanceString, dateString) => {
  const dateNaissance = DateTime.fromISO(dateNaissanceString).setLocale("fr-FR");
  const dateObj = DateTime.fromISO(dateString).setLocale("fr-FR");
  const diffInYears = dateObj.diff(dateNaissance, "years");
  const { years } = diffInYears.toObject();
  const age = years ? Math.floor(years) : 0;
  return {
    age,
    exactAge: years,
  };
};

export const normalizeInputNumberForDb = (data) => (data && !isNaN(data) && parseInt(data) !== 0 ? data : null);

export const doAsyncCodePostalActions = async (value, data, dossierId) => {
  try {
    const response = await _post(`/api/v1/geo/cp`, {
      codePostal: value,
      dossierId,
    });

    if (response.messages.cp === "Ok") {
      return {
        successed: true,
        data: {
          codePostal: value,
          commune: response.result.commune,
          departement: response.result.num_departement,
          region: response.result.num_region,
        },
        message: null,
      };
    }

    return {
      successed: false,
      data: null,
      message: response.messages.error,
    };
  } catch (error) {
    return {
      successed: false,
      data: null,
      message: error.prettyMessage,
    };
  }
};
