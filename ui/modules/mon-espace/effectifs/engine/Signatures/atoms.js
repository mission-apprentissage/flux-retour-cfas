import { atom, selector } from "recoil";
import { valueSelector } from "../formEngine/atoms";

export const signaturesCompletionSelector = selector({
  key: "signaturesCompletionSelector",
  get: ({ get }) => {
    const lieuSignature = get(valueSelector("contrat.lieuSignatureContrat"));

    const completion = lieuSignature ? 100 : 0;
    return {
      complete: completion === 100,
      completion,
    };
  },
});

export const signaturesPdfLoadedAtom = atom({
  key: "signaturesPdfLoadedAtom",
  default: false,
});
