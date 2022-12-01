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

  fields[`apprenant.nouveau_statut.date_statut`] = {
    ...createField({
      forceFieldDefinition: `apprenant.historique_statut[].date_statut`,
      name: `apprenant.nouveau_statut.date_statut`,
      data: "",
    }),
    locked: false,
  };
  fields[`apprenant.nouveau_statut.valeur_statut`] = {
    ...createField({
      forceFieldDefinition: `apprenant.historique_statut[].valeur_statut`,
      name: `apprenant.nouveau_statut.valeur_statut`,
      data: "",
    }),
    locked: false,
  };

  cerfa.apprenant.historique_statut.value.forEach((statut, i) => {
    const prefix = `apprenant.historique_statut[${i}]`;
    fields[`${prefix}.date_statut`] = createField({
      name: `${prefix}.date_statut`,
      data: { value: statut.date_statut },
    });
    fields[`${prefix}.date_reception`] = createField({
      name: `${prefix}.date_reception`,
      data: { value: statut.date_reception },
    });
    fields[`${prefix}.valeur_statut`] = createField({
      name: `${prefix}.valeur_statut`,
      data: { value: statut.valeur_statut },
    });
  });

  [
    {
      siret: "",
      denomination: "",
      naf: "",
      nombre_de_salaries: "",
      type_employeur: "",
      date_debut: "",
      date_fin: "",
      date_rupture: "",
      adresse: {
        numero: "",
        repetition_voie: "",
        voie: "",
        complement: "",
        code_postal: "",
        commune: "",
        departement: "",
        region: "",
      },
    },
    ...cerfa.apprenant.contrats.value,
  ].forEach((contrat, i) => {
    const prefix = `apprenant.contrats[${i}]`;
    const isFirstLine = i === 0;
    fields[`${prefix}.siret`] = {
      ...createField({
        name: `${prefix}.siret`,
        data: { value: contrat.siret },
      }),
      ...(isFirstLine ? { autosave: false, locked: false } : {}),
    };
    fields[`${prefix}.denomination`] = {
      ...createField({
        name: `${prefix}.denomination`,
        data: { value: contrat.denomination },
      }),
      ...(isFirstLine ? { autosave: false } : {}),
    };
    fields[`${prefix}.naf`] = {
      ...createField({
        name: `${prefix}.naf`,
        data: { value: contrat.naf },
      }),
      ...(isFirstLine ? { autosave: false } : {}),
    };
    fields[`${prefix}.nombre_de_salaries`] = {
      ...createField({
        name: `${prefix}.nombre_de_salaries`,
        data: { value: contrat.nombre_de_salaries },
      }),
      ...(isFirstLine ? { autosave: false } : {}),
    };
    fields[`${prefix}.type_employeur`] = {
      ...createField({
        name: `${prefix}.type_employeur`,
        data: { value: contrat.type_employeur },
      }),
      ...(isFirstLine ? { autosave: false, locked: false } : {}),
    };
    fields[`${prefix}.date_debut`] = {
      ...createField({
        name: `${prefix}.date_debut`,
        data: { value: contrat.date_debut },
      }),
      ...(isFirstLine ? { autosave: false, locked: false } : {}),
    };
    fields[`${prefix}.date_fin`] = {
      ...createField({
        name: `${prefix}.date_fin`,
        data: { value: contrat.date_fin },
      }),
      ...(isFirstLine ? { autosave: false, locked: false } : {}),
    };
    fields[`${prefix}.date_rupture`] = {
      ...createField({
        name: `${prefix}.date_rupture`,
        data: { value: contrat.date_rupture },
      }),
      ...(isFirstLine ? { autosave: false, locked: false } : {}),
    };
    fields[`${prefix}.adresse.numero`] = {
      ...createField({
        name: `${prefix}.adresse.numero`,
        data: { value: contrat.adresse.numero },
      }),
      ...(isFirstLine ? { autosave: false } : {}),
    };
    fields[`${prefix}.adresse.repetition_voie`] = {
      ...createField({
        name: `${prefix}.adresse.repetition_voie`,
        data: { value: contrat.adresse.repetition_voie },
      }),
      ...(isFirstLine ? { autosave: false } : {}),
    };
    fields[`${prefix}.adresse.voie`] = {
      ...createField({
        name: `${prefix}.adresse.voie`,
        data: { value: contrat.adresse.voie },
      }),
      ...(isFirstLine ? { autosave: false } : {}),
    };
    fields[`${prefix}.adresse.complement`] = {
      ...createField({
        name: `${prefix}.adresse.complement`,
        data: { value: contrat.adresse.complement },
      }),
      ...(isFirstLine ? { autosave: false } : {}),
    };
    fields[`${prefix}.adresse.code_postal`] = {
      ...createField({
        name: `${prefix}.adresse.code_postal`,
        data: { value: contrat.adresse.code_postal },
      }),
      ...(isFirstLine ? { autosave: false } : {}),
    };
    fields[`${prefix}.adresse.commune`] = {
      ...createField({
        name: `${prefix}.adresse.commune`,
        data: { value: contrat.adresse.commune },
      }),
      ...(isFirstLine ? { autosave: false } : {}),
    };
    fields[`${prefix}.adresse.departement`] = {
      ...createField({
        name: `${prefix}.adresse.departement`,
        data: { value: contrat.adresse.departement },
      }),
      ...(isFirstLine ? { autosave: false } : {}),
    };
    fields[`${prefix}.adresse.region`] = {
      ...createField({
        name: `${prefix}.adresse.region`,
        data: { value: contrat.adresse.region },
      }),
      ...(isFirstLine ? { autosave: false } : {}),
    };
  });

  return fields;
};

const createFieldFactory =
  ({ schema, modeSifa }) =>
  ({ name, data, forceFieldDefinition = null }) => {
    const fieldSchema = findDefinition({ name: forceFieldDefinition || name, schema });
    if (!fieldSchema) throw new Error(`Field ${name} is not defined.`);

    if (modeSifa) {
      fieldSchema.required = true; // TODO
      fieldSchema.warning = "SIFA"; // TODO
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
