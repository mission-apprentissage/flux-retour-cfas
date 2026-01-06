import get from "lodash.get";
import { DateTime } from "luxon";

import { findDefinition } from "./utils";
import { isEmptyValue } from "./utils/isEmptyValue";

export const initFields = ({ effectifForm, schema, canEdit, organisme }) => {
  const createField = createFieldFactory({
    schema,
  });
  const fields = {};
  const isAPITransmission = organisme.mode_de_transmission === "API";

  Object.keys(schema.fields).forEach((name) => {
    const data = get(effectifForm, name);
    if (!data) return;
    fields[name] = { ...createField({ name, data }), ...(!canEdit ? { locked: true } : {}) };
  });

  let historique_statut: any[] = [];
  let showAddStatut = true;
  if (!!effectifForm.apprenant.historique_statut.value.length || !canEdit || isAPITransmission) {
    historique_statut = effectifForm.apprenant.historique_statut.value;
    showAddStatut = false;
  } else {
    fields["apprenant.nouveau_statut"] = createField({
      name: "apprenant.nouveau_statut",
      data: "",
    });

    historique_statut = [
      {
        date_statut: "",
        date_reception: "",
        valeur_statut: "",
      },
      ...effectifForm.apprenant.historique_statut.value,
    ];
  }

  historique_statut.forEach((statut, i) => {
    const prefix = `apprenant.historique_statut[${i}]`;
    const showAddStatutFirstLine = i === 0 && showAddStatut;

    fields[`${prefix}.date_statut`] = {
      ...createField({
        name: `${prefix}.date_statut`,
        data: { value: statut.date_statut },
      }),
      ...(showAddStatutFirstLine ? { autosave: false, locked: false } : {}),
    };
    fields[`${prefix}.date_reception`] = {
      ...createField({
        name: `${prefix}.date_reception`,
        data: { value: statut.date_reception },
      }),
      ...(showAddStatutFirstLine ? { autosave: false, locked: false } : {}),
    };
    fields[`${prefix}.valeur_statut`] = {
      ...createField({
        name: `${prefix}.valeur_statut`,
        data: { value: statut.valeur_statut },
      }),
      ...(showAddStatutFirstLine ? { autosave: false, locked: false } : {}),
    };
  });

  let contrats: any[] = [];
  let showAddContrat = true;
  if (!!effectifForm.contrats.value.length || !canEdit || isAPITransmission) {
    contrats = effectifForm.contrats.value;
    showAddContrat = false;
  } else {
    fields["apprenant.nouveau_contrat"] = createField({
      name: "apprenant.nouveau_contrat",
      data: "",
    });
    contrats = [...effectifForm.contrats.value];
  }
  contrats.forEach((contrat, i) => {
    const prefix = `contrats[${i}]`;
    const showAddContratFirstLine = i === 0 && showAddContrat;
    fields[`${prefix}.siret`] = {
      ...createField({
        name: `${prefix}.siret`,
        data: { value: contrat.siret },
      }),
      ...(showAddContratFirstLine ? { autosave: false, locked: false } : {}),
    };
    fields[`${prefix}.denomination`] = {
      ...createField({
        name: `${prefix}.denomination`,
        data: { value: contrat.denomination },
      }),
      ...(showAddContratFirstLine ? { autosave: false } : {}),
    };
    fields[`${prefix}.naf`] = {
      ...createField({
        name: `${prefix}.naf`,
        data: { value: contrat.naf },
      }),
      ...(showAddContratFirstLine ? { autosave: false } : {}),
    };
    fields[`${prefix}.nombre_de_salaries`] = {
      ...createField({
        name: `${prefix}.nombre_de_salaries`,
        data: { value: contrat.nombre_de_salaries },
      }),
      ...(showAddContratFirstLine ? { autosave: false } : {}),
    };
    fields[`${prefix}.type_employeur`] = {
      ...createField({
        name: `${prefix}.type_employeur`,
        data: { value: contrat.type_employeur },
      }),
      ...(showAddContratFirstLine ? { autosave: false, locked: false } : {}),
    };
    fields[`${prefix}.date_debut`] = {
      ...createField({
        name: `${prefix}.date_debut`,
        data: { value: contrat.date_debut },
      }),
      ...(showAddContratFirstLine ? { autosave: false, locked: false } : {}),
    };
    fields[`${prefix}.date_fin`] = {
      ...createField({
        name: `${prefix}.date_fin`,
        data: { value: contrat.date_fin },
      }),
      ...(showAddContratFirstLine ? { autosave: false, locked: false } : {}),
    };
    fields[`${prefix}.date_rupture`] = {
      ...createField({
        name: `${prefix}.date_rupture`,
        data: { value: contrat.date_rupture },
      }),
      ...(showAddContratFirstLine ? { autosave: false, locked: false } : {}),
    };
    fields[`${prefix}.adresse.numero`] = {
      ...createField({
        name: `${prefix}.adresse.numero`,
        data: { value: contrat.adresse?.numero },
      }),
      ...(showAddContratFirstLine ? { autosave: false } : {}),
    };
    fields[`${prefix}.adresse.repetition_voie`] = {
      ...createField({
        name: `${prefix}.adresse.repetition_voie`,
        data: { value: contrat.adresse?.repetition_voie },
      }),
      ...(showAddContratFirstLine ? { autosave: false } : {}),
    };
    fields[`${prefix}.adresse.voie`] = {
      ...createField({
        name: `${prefix}.adresse.voie`,
        data: { value: contrat.adresse?.voie },
      }),
      ...(showAddContratFirstLine ? { autosave: false } : {}),
    };
    fields[`${prefix}.adresse.complement`] = {
      ...createField({
        name: `${prefix}.adresse.complement`,
        data: { value: contrat.adresse?.complement },
      }),
      ...(showAddContratFirstLine ? { autosave: false } : {}),
    };
    fields[`${prefix}.adresse.code_postal`] = {
      ...createField({
        name: `${prefix}.adresse.code_postal`,
        data: { value: contrat.adresse?.code_postal },
      }),
      ...(showAddContratFirstLine ? { autosave: false } : {}),
    };
    fields[`${prefix}.adresse.commune`] = {
      ...createField({
        name: `${prefix}.adresse.commune`,
        data: { value: contrat.adresse?.commune },
      }),
      ...(showAddContratFirstLine ? { autosave: false } : {}),
    };
    fields[`${prefix}.adresse.departement`] = {
      ...createField({
        name: `${prefix}.adresse.departement`,
        data: { value: contrat.adresse?.departement },
      }),
      ...(showAddContratFirstLine ? { autosave: false } : {}),
    };
    fields[`${prefix}.adresse.region`] = {
      ...createField({
        name: `${prefix}.adresse.region`,
        data: { value: contrat.adresse?.region },
      }),
      ...(showAddContratFirstLine ? { autosave: false } : {}),
    };
  });

  if (effectifForm.validation_errors.length) {
    for (const validation_error of effectifForm.validation_errors) {
      if (fields[validation_error.fieldName]) {
        fields[validation_error.fieldName] = {
          ...fields[validation_error.fieldName],
          ...(validation_error.willNotBeModified
            ? validation_error.isRequired
              ? {
                  error: () => (
                    <p>
                      La donnée transmise&nbsp;<strong>&quot;{validation_error.inputValue}&quot;</strong>
                      &nbsp;n&rsquo;est&nbsp;pas&nbsp;valide&nbsp;pour&nbsp;ce&nbsp;champ.
                      <br />
                      <strong>Ce champ est obligatoire.</strong>
                    </p>
                  ),
                }
              : {
                  error: () => (
                    <p>
                      La donnée transmise&nbsp;<strong>&quot;{validation_error.inputValue}&quot;</strong>
                      &nbsp;n&rsquo;est&nbsp;pas&nbsp;valide&nbsp;pour&nbsp;ce&nbsp;champ.
                      <br /> Ce champ a déjà rempli, il sera donc pas modifié.
                    </p>
                  ),
                }
            : {
                error: () => (
                  <p>
                    La donnée transmise&nbsp;<strong>&quot;{validation_error.inputValue}&quot;</strong>
                    &nbsp;n&rsquo;est pas valide pour ce champ.
                  </p>
                ),
              }),
        };
      }
    }
  }

  return fields;
};

const createFieldFactory =
  ({ schema }) =>
  ({ name, data, forceFieldDefinition = null }) => {
    const fieldSchema = findDefinition({ name: forceFieldDefinition || name, schema });
    if (!fieldSchema) throw new Error(`Field ${name} is not defined.`);

    const type = fieldSchema.fieldType;
    let value = data.value;
    if (type === "date") {
      value = value ? DateTime.fromISO(data.value).setLocale("fr-FR").toFormat("yyyy-MM-dd") : "";
    } else if (type === "number") {
      value = value ? `${value}` : "";
    }

    return {
      minLength: data.minLength,
      maxLength: data.maxLength,
      min: data.min,
      max: data.max,
      pattern: data.pattern,
      enum: data.enum,
      ...fieldSchema,
      locked: true,
      success: !isEmptyValue(data?.value),
      description: fieldSchema.showInfo ? data.description : fieldSchema.description,
      example: data.example,
      value,
      name,
    };
  };
