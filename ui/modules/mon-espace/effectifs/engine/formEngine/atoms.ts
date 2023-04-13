import { atom, selector, selectorFamily } from "recoil";
import { getValues } from "./utils/getValues";
// import { getFormStatus } from "../cerfaForm/completion";
import { effectifsStateAtom } from "../atoms";

export const cerfaAtom = atom({
  key: "cerfaAtom",
  default: undefined,
});

export const cerfaStatusGetter = selector({
  key: "errorsGetter",
  get: ({ get }) => {
    const fields = get(cerfaAtom);
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
      set(effectifsStateAtom, (prevEffectifsState) => {
        // eslint-disable-next-line no-undef
        const newEffectifsState = new Map(JSON.parse(JSON.stringify(Array.from(prevEffectifsState))));
        let validation_errors = [];
        const { validation_errors: prevValidationErrors, requiredSifa: prevRequiredSifa } =
          newEffectifsState.get(effectifId);
        for (const validation_error of prevValidationErrors) {
          if (!inputNames.includes(validation_error.fieldName)) {
            validation_errors.push(validation_error);
          }
        }
        let requiredSifa = [];
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
      const effectifsState = get(effectifsStateAtom);
      const { validation_errors, requiredSifa } = effectifsState.get(effectifId) ?? {
        validation_errors: [],
        requiredSifa: [],
      };
      const validationErrorsByBlock = {
        statuts: [],
        apprenant: [],
        formation: [],
        contrats: [],
      };
      for (const validation_error of validation_errors) {
        if (validation_error.fieldName.includes("apprenant.contrats")) {
          validationErrorsByBlock.contrats.push(validation_error);
        } else if (validation_error.fieldName.includes("apprenant.historique_statut")) {
          validationErrorsByBlock.statuts.push(validation_error);
        } else if (validation_error.fieldName.includes("formation.")) {
          validationErrorsByBlock.formation.push(validation_error);
        } else {
          validationErrorsByBlock.apprenant.push(validation_error);
        }
      }

      const requiredSifaByBlock = {
        statuts: [],
        apprenant: [],
        formation: [],
        contrats: [],
      };
      for (const currentRequiredSifa of requiredSifa) {
        if (currentRequiredSifa.includes("apprenant.contrats")) {
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

export const cerfaSetter = selector({
  key: "cerfaSetter",
  get: () => ({}),
  set: ({ set }, payload) => {
    set(cerfaAtom, (cerfa) => {
      let newState = { ...cerfa };
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

export const valueSelector = selectorFamily({
  key: "valueSelector",
  get:
    (name) =>
    ({ get }) =>
      get(cerfaAtom)?.[name]?.value,
});

export const valuesSelector = selector({ key: "valuesSelector", get: ({ get }) => getValues(get(cerfaAtom)) });

export const fieldSelector = selectorFamily({
  key: "fieldSelector",
  get:
    (name) =>
    ({ get }) => {
      return get(cerfaAtom)?.[name];
    },
});
