import { atom, selector, selectorFamily } from "recoil";
import { getValues } from "./utils/getValues";
import { getFormStatus } from "../cerfaForm/completion";
import { dossierAtom } from "../atoms";

export const cerfaAtom = atom({
  key: "cerfaAtom",
  default: undefined,
});

export const cerfaStatusGetter = selector({
  key: "errorsGetter",
  get: ({ get }) => {
    const fields = get(cerfaAtom);
    const values = get(valuesSelector);
    const dossier = get(dossierAtom);
    if (!fields || !values) return;
    return getFormStatus({ fields, values, dossier });
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
