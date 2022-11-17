import get from "lodash.get";
import { findDefinition } from "./utils";
import { DateTime } from "luxon";
import { isEmptyValue } from "./utils/isEmptyValue";

export const initFields = ({ cerfa, schema }) => {
  const createField = createFieldFactory({ draft: cerfa.draft, schema });
  let fields = {};

  Object.keys(schema.fields).forEach((name) => {
    const data = get(cerfa, name);
    if (!data) return;
    fields[name] = createField({ name, data });
  });

  cerfa.contrat.remunerationsAnnuelles.forEach((annee, i) => {
    fields[`contrat.remunerationsAnnuelles[${i}].dateDebut`] = createField({
      name: `contrat.remunerationsAnnuelles[${i}].dateDebut`,
      data: annee.dateDebut,
    });
    fields[`contrat.remunerationsAnnuelles[${i}].dateFin`] = createField({
      name: `contrat.remunerationsAnnuelles[${i}].dateFin`,
      data: annee.dateFin,
    });
    fields[`contrat.remunerationsAnnuelles[${i}].taux`] = createField({
      name: `contrat.remunerationsAnnuelles[${i}].taux`,
      data: annee.taux,
    });
    fields[`contrat.remunerationsAnnuelles[${i}].ordre`] = createField({
      name: `contrat.remunerationsAnnuelles[${i}].ordre`,
      data: annee.ordre,
    });
    fields[`contrat.remunerationsAnnuelles[${i}].salaireBrut`] = createField({
      name: `contrat.remunerationsAnnuelles[${i}].salaireBrut`,
      data: annee.salaireBrut,
    });
    fields[`contrat.remunerationsAnnuelles[${i}].tauxMinimal`] = createField({
      name: `contrat.remunerationsAnnuelles[${i}].tauxMinimal`,
      data: annee.tauxMinimal,
    });
    fields[`contrat.remunerationsAnnuelles[${i}].typeSalaire`] = createField({
      name: `contrat.remunerationsAnnuelles[${i}].typeSalaire`,
      data: annee.typeSalaire,
    });
  });

  fields["employeur.codeIdcc_special"] = createField({
    name: `employeur.codeIdcc_special`,
    data: { value: cerfa.employeur.codeIdcc.value },
  });

  return fields;
};

const createFieldFactory =
  ({ draft, schema }) =>
  ({ name, data }) => {
    const fieldSchema = findDefinition({ name, schema });
    if (!fieldSchema) throw new Error(`Field ${name} is not defined.`);
    const type = fieldSchema.fieldType;
    let value = data.value;
    if (type === "date") {
      value = value ? DateTime.fromISO(data.value).setLocale("fr-FR").toFormat("yyyy-MM-dd") : "";
    } else if (type === "number") {
      value = value + "";
    }

    return {
      minLength: data.minLength,
      maxLength: data.maxLength,
      min: data.min,
      max: data.max,
      pattern: data.pattern,
      enum: data.enum,
      ...fieldSchema,
      locked: !draft ? true : fieldSchema.locked ?? data.locked,
      success: !isEmptyValue(data?.value),
      description: fieldSchema.showInfo ? data.description : fieldSchema.description,
      example: data.example,
      value,
      name,
    };
  };
