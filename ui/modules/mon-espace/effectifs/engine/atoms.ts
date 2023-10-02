import { atom, selector } from "recoil";

import { EffectifFormStatusStatusGetter } from "./formEngine/atoms";
// import { documentsCompletionStatusGetter } from "./TransmissionFichier/documentsAtoms";

export const dossierCompletionStatus = selector({
  key: "dossierCompletionStatus",
  get: ({ get }) => {
    const effectifFormCompletionStatus: any = get(EffectifFormStatusStatusGetter);
    // const documentsCompletionStatus = get(documentsCompletionStatusGetter);
    return {
      effectifForm: {
        completion: effectifFormCompletionStatus?.completion,
        complete: effectifFormCompletionStatus?.completion === 100,
      },
      // documents: documentsCompletionStatus,
      dossier: {
        // complete: effectifFormCompletionStatus?.completion + documentsCompletionStatus?.completion === 200,
        // completion: (effectifFormCompletionStatus?.completion + documentsCompletionStatus?.completion) / 2,
      },
    };
  },
});

export const dossierAtom = atom({
  key: "dossierAtom",
  default: null,
});

export const effectifIdAtom = atom({
  key: "effectifIdAtom",
  default: null,
});

export const effectifsStateAtom = atom({
  key: "effectifsStateAtom",
  // eslint-disable-next-line no-undef
  default: new Map(),
});
