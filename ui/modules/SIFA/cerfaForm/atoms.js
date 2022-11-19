import { selector } from "recoil";
import { dossierAtom } from "../atoms";
import { getFormStatus } from "./completion";
import { cerfaAtom, valuesSelector } from "../formEngine/atoms";

export const atoms = selector({
  key: "cerfaFormCompletionSelector",
  get: ({ get }) => {
    const fields = get(cerfaAtom);
    const values = get(valuesSelector);
    const dossier = get(dossierAtom);
    if (!fields || !values) return;
    return getFormStatus({ fields, values, dossier });
  },
});
