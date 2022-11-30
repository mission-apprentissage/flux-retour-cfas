import get from "lodash.get";
import { findDefinition } from "./utils";
import { DateTime } from "luxon";
import { isEmptyValue } from "./utils/isEmptyValue";

export const initFields = ({ cerfa, schema, modeSifa }) => {
  const createField = createFieldFactory({ modeSifa, schema });
  let fields = {};

  Object.keys(schema.fields).forEach((name) => {
    const data = get(cerfa, name);
    if (!data) return;
    fields[name] = createField({ name, data });
  });

  fields[`apprenant.nouveau_statut.date_statut`] = createField({
    name: `apprenant.nouveau_statut.date_statut`,
    data: "",
  });
  fields[`apprenant.nouveau_statut.valeur_statut`] = createField({
    name: `apprenant.nouveau_statut.valeur_statut`,
    data: "",
  });

  cerfa.apprenant.historique_statut.value.forEach((statut, i) => {
    fields[`apprenant.historique_statut[${i}].date_statut`] = createField({
      name: `apprenant.historique_statut[${i}].date_statut`,
      data: { value: statut.date_statut },
    });
    fields[`apprenant.historique_statut[${i}].date_reception`] = createField({
      name: `apprenant.historique_statut[${i}].date_reception`,
      data: { value: statut.date_reception },
    });
    fields[`apprenant.historique_statut[${i}].valeur_statut`] = createField({
      name: `apprenant.historique_statut[${i}].valeur_statut`,
      data: { value: statut.valeur_statut },
    });
  });

  return fields;
};

const createFieldFactory =
  ({ schema, modeSifa }) =>
  ({ name, data }) => {
    const fieldSchema = findDefinition({ name, schema });
    if (!fieldSchema) throw new Error(`Field ${name} is not defined.`);

    if (modeSifa) {
      fieldSchema.required = true;
      fieldSchema.error = "SIFA";
    }

    const type = fieldSchema.fieldType;
    let value = data.value;
    if (type === "date") {
      value = value ? DateTime.fromISO(data.value).setLocale("fr-FR").toFormat("yyyy-MM-dd") : "";
    } else if (type === "number") {
      value = value ? value + "" : "";
    }

    return {
      minLength: data.minLength,
      maxLength: data.maxLength,
      min: data.min,
      max: data.max,
      pattern: data.pattern,
      enum: data.enum,
      ...fieldSchema,
      // locked: !draft ? true : fieldSchema.locked ?? data.locked,
      locked: fieldSchema.locked ?? data.locked,
      success: !isEmptyValue(data?.value),
      description: fieldSchema.showInfo ? data.description : fieldSchema.description,
      example: data.example,
      value,
      name,
    };
  };
