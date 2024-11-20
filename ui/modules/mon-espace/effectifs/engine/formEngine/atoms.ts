import { atom, selector, selectorFamily } from "recoil";

import { effectifsStateAtom } from "@/modules/mon-espace/effectifs/engine/atoms";

import { getValues } from "./utils/getValues";

export const effectifFormAtom = atom({
  key: "effectifFormAtom",
  default: undefined,
});

export const EffectifFormStatusStatusGetter = selector({
  key: "errorsGetter",
  get: ({ get }) => {
    const fields = get(effectifFormAtom);
    const values = get(valuesSelector);
    // const dossier = get(dossierAtom);
    if (!(fields && values)) return;
    // return getFormStatus({ fields, values, dossier });
    return null;
  },
});

export const effectifStateSelector = selectorFamily({
  key: "effectifStateSelector",
  set:
    (effectifId) =>
    ({ set }, { inputNames }) => {
      set(effectifsStateAtom, (prevEffectifsState: any) => {
        // eslint-disable-next-line no-undef
        const newEffectifsState = new Map<any, any>(JSON.parse(JSON.stringify(Array.from(prevEffectifsState))));
        const validation_errors: any[] = [];
        const {
          validation_errors: prevValidationErrors,
          requiredSifa: prevRequiredSifa,
        }: { validation_errors: any[]; requiredSifa: any[] } = newEffectifsState.get(effectifId);
        for (const validation_error of prevValidationErrors) {
          if (!inputNames.includes(validation_error.fieldName)) {
            validation_errors.push(validation_error);
          }
        }
        const requiredSifa: any[] = [];
        for (const currentRequiredSifa of prevRequiredSifa) {
          if (!inputNames.includes(currentRequiredSifa)) {
            requiredSifa.push(currentRequiredSifa);
          }
        }
        newEffectifsState.set(effectifId, { validation_errors, requiredSifa });

        return newEffectifsState;
      });
    },
  get:
    (effectifId) =>
    ({ get }) => {
      const effectifsState: any = get(effectifsStateAtom);
      const { validation_errors, requiredSifa } = effectifsState.get(effectifId) ?? {
        validation_errors: [],
        requiredSifa: [],
      };
      const validationErrorsByBlock: {
        statuts: any[];
        apprenant: any[];
        formation: any[];
        contrats: any[];
        lieu_de_formation: any[];
      } = {
        statuts: [],
        apprenant: [],
        formation: [],
        contrats: [],
        lieu_de_formation: [],
      };
      for (const validation_error of validation_errors) {
        if (validation_error.fieldName.includes("lieu_de_formation")) {
          validationErrorsByBlock.lieu_de_formation.push(validation_error);
        } else if (validation_error.fieldName.includes("contrats")) {
          validationErrorsByBlock.contrats.push(validation_error);
        } else if (validation_error.fieldName.includes("apprenant.historique_statut")) {
          validationErrorsByBlock.statuts.push(validation_error);
        } else if (validation_error.fieldName.includes("formation.")) {
          validationErrorsByBlock.formation.push(validation_error);
        } else {
          validationErrorsByBlock.apprenant.push(validation_error);
        }
      }

      const requiredSifaByBlock: {
        statuts: any[];
        apprenant: any[];
        formation: any[];
        contrats: any[];
        lieu_de_formation: any[];
      } = {
        statuts: [],
        apprenant: [],
        formation: [],
        contrats: [],
        lieu_de_formation: [],
      };
      for (const currentRequiredSifa of requiredSifa) {
        if (currentRequiredSifa.includes("lieu_de_formation")) {
          requiredSifaByBlock.lieu_de_formation.push(currentRequiredSifa);
        } else if (currentRequiredSifa.includes("contrats")) {
          requiredSifaByBlock.contrats.push(currentRequiredSifa);
        } else if (currentRequiredSifa.includes("apprenant.historique_statut")) {
          requiredSifaByBlock.statuts.push(currentRequiredSifa);
        } else if (currentRequiredSifa.includes("formation.")) {
          requiredSifaByBlock.formation.push(currentRequiredSifa);
        } else {
          requiredSifaByBlock.apprenant.push(currentRequiredSifa);
        }
      }

      return { validation_errors, validationErrorsByBlock, requiredSifa, requiredSifaByBlock };
    },
});

export const effectifFormSetter = selector({
  key: "effectifFormSetter",
  get: () => ({}),
  set: ({ set }, payload) => {
    set(effectifFormAtom, (effectifForm: any) => {
      let newState = { ...effectifForm };
      Object.entries(payload).forEach(([name, patch]) => {
        if (patch === undefined) {
          delete newState[name];
          return;
        }
        newState = { ...newState, [name]: { ...newState[name], ...patch } };
        if (patch.value !== undefined && patch.touched === undefined) {
          newState[name].touched = true;
        }
      });
      return newState;
    });
  },
});

export const valuesSelector = selector({
  key: "valuesSelector",
  get: ({ get }) => getValues(get(effectifFormAtom) as any),
});

export const fieldSelector = selectorFamily({
  key: "fieldSelector",
  get:
    (name: string) =>
    ({ get }) => {
      return get(effectifFormAtom)?.[name];
    },
});
