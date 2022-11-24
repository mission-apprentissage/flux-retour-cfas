import { shouldAskAvantageNature } from "../../cerfaForm/blocks/contrat/domain/shouldAskAvantageNature";

export const avantagesNatureControl = [
  {
    deps: ["contrat.avantageNature"],
    process: ({ values, cache }) => {
      const askAvantageNature = shouldAskAvantageNature({ values });
      if (askAvantageNature) {
        return {
          cascade: {
            "contrat.avantageNourriture": { value: cache?.avantageNourriture },
            "contrat.avantageLogement": { value: cache?.avantageLogement },
            "contrat.autreAvantageEnNature": { value: cache?.autreAvantageEnNature },
          },
        };
      } else {
        return {
          cache: values.contrat.avantageNourriture,
          cascade: {
            "contrat.avantageNourriture": { reset: true },
            "contrat.avantageLogement": { reset: true },
            "contrat.autreAvantageEnNature": { reset: true },
          },
        };
      }
    },
  },
  {
    target: "avantageNature",
    blocCompletion: "contat",
    deps: ["contrat.avantageNourriture", "contrat.avantageLogement", "contrat.autreAvantageEnNature"],
    process: ({ values }) => {
      const isMissingField =
        values.contrat.avantageNature &&
        !values.contrat.avantageNourriture &&
        !values.contrat.avantageLogement &&
        !values.contrat.autreAvantageEnNature;
      if (isMissingField) {
        return { error: "Sous partie avantage en nature" };
      }
    },
  },
];
