import { shouldAskRepresentantLegal } from "../../cerfaForm/blocks/apprenti/domain/shouldAskRepresentantLegal";
import { createCopyRules } from "./utils/createCopyRules";

export const responsableLegalControl = [
  {
    deps: ["apprenti.apprentiMineur"],
    process: ({ values }) => {
      return {
        cascade: {
          "apprenti.apprentiMineurNonEmancipe":
            values.apprenti.apprentiMineur === true ? { locked: false, reset: true } : { locked: true, value: false },
        },
      };
    },
  },
  {
    deps: ["apprenti.apprentiMineurNonEmancipe"],
    process: ({ values, cache }) => {
      if (shouldAskRepresentantLegal({ values })) {
        const cachedValueOrResetRequired = (value) => ({ value, reset: !value, required: true });
        return {
          cache,
          cascade: {
            "apprenti.responsableLegal.nom": cachedValueOrResetRequired(cache?.nom),
            "apprenti.responsableLegal.prenom": cachedValueOrResetRequired(cache?.prenom),
            "apprenti.responsableLegal.memeAdresse": cachedValueOrResetRequired(cache?.memeAdresse),
          },
        };
      } else {
        const requiredAndReset = { reset: true, required: false };
        return {
          cache: values.apprenti.responsableLegal,
          cascade: {
            "apprenti.responsableLegal.nom": requiredAndReset,
            "apprenti.responsableLegal.prenom": requiredAndReset,
            "apprenti.responsableLegal.memeAdresse": requiredAndReset,
          },
        };
      }
    },
  },
  {
    deps: ["apprenti.apprentiMineurNonEmancipe", "apprenti.responsableLegal.memeAdresse"],
    process: ({ values, cache }) => {
      const cachedValueOrReset = (value) => ({ value, reset: !value });
      const cachedValueOrResetRequired = (value) => ({ value, reset: !value, required: true });
      const memeAdresse = values.apprenti.responsableLegal.memeAdresse;
      if (memeAdresse !== true && memeAdresse !== false) {
        const notRequiredAndReset = { reset: true, required: false };
        return {
          cascade: {
            "apprenti.responsableLegal.adresse.numero": notRequiredAndReset,
            "apprenti.responsableLegal.adresse.voie": notRequiredAndReset,
            "apprenti.responsableLegal.adresse.complement": notRequiredAndReset,
            "apprenti.responsableLegal.adresse.codePostal": notRequiredAndReset,
            "apprenti.responsableLegal.adresse.commune": notRequiredAndReset,
            "apprenti.responsableLegal.adresse.pays": notRequiredAndReset,
          },
        };
      } else if (!memeAdresse) {
        return {
          cache,
          cascade: {
            "apprenti.responsableLegal.adresse.numero": cachedValueOrReset(cache?.numero),
            "apprenti.responsableLegal.adresse.voie": cachedValueOrResetRequired(cache?.voie),
            "apprenti.responsableLegal.adresse.complement": cachedValueOrReset(cache?.complement),
            "apprenti.responsableLegal.adresse.codePostal": cachedValueOrResetRequired(cache?.codePostal),
            "apprenti.responsableLegal.adresse.commune": cachedValueOrResetRequired(cache?.commune),
            "apprenti.responsableLegal.adresse.pays": cachedValueOrResetRequired(cache?.pays),
          },
        };
      } else {
        const createCascadeValue = (value) => ({ value, reset: true });
        return {
          cache: values.apprenti.responsableLegal.adresse,
          cascade: {
            "apprenti.responsableLegal.adresse.numero": createCascadeValue(values.apprenti.adresse.numero),
            "apprenti.responsableLegal.adresse.voie": createCascadeValue(values.apprenti.adresse.voie),
            "apprenti.responsableLegal.adresse.complement": createCascadeValue(values.apprenti.adresse.complement),
            "apprenti.responsableLegal.adresse.codePostal": createCascadeValue(values.apprenti.adresse.codePostal),
            "apprenti.responsableLegal.adresse.commune": createCascadeValue(values.apprenti.adresse.commune),
            "apprenti.responsableLegal.adresse.pays": createCascadeValue(values.apprenti.adresse.pays),
          },
        };
      }
    },
  },
  ...createCopyRules({
    copyIf: ({ values }) => values.apprenti.responsableLegal.memeAdresse,
    mapping: {
      "apprenti.adresse.numero": "apprenti.responsableLegal.adresse.numero",
      "apprenti.adresse.voie": "apprenti.responsableLegal.adresse.voie",
      "apprenti.adresse.complement": "apprenti.responsableLegal.adresse.complement",
      "apprenti.adresse.codePostal": "apprenti.responsableLegal.adresse.codePostal",
      "apprenti.adresse.commune": "apprenti.responsableLegal.adresse.commune",
      "apprenti.adresse.pays": "apprenti.responsableLegal.adresse.pays",
    },
  }),
];
