import { getLabelNumeroContratPrecedent } from "../../cerfaForm/blocks/contrat/domain/getLabelNumeroContratPrecedent";
import { isRequiredNumeroContratPrecedent } from "../../cerfaForm/blocks/contrat/domain/isRequiredNumeroContratPrecedent";
import { shouldAskNumeroContratPrecedent } from "../../cerfaForm/blocks/contrat/domain/shouldAskContratPrecedent";
import { shouldAskDateEffetAvenant } from "../../cerfaForm/blocks/contrat/domain/shouldAskDateEffetAvenant";

export const typeContratAppControl = [
  {
    deps: ["contrat.typeContratApp"],
    process: ({ values }) => {
      return {
        cascade: {
          "contrat.numeroContratPrecedent": shouldAskNumeroContratPrecedent({ values })
            ? {
                label: getLabelNumeroContratPrecedent({ values }),
                required: isRequiredNumeroContratPrecedent({ values }),
              }
            : { reset: true, required: false },
          "contrat.dateEffetAvenant": shouldAskDateEffetAvenant({ values })
            ? { required: true }
            : { required: false, reset: true },
        },
      };
    },
  },
];
