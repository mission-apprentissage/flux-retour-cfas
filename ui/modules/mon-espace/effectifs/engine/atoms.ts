import { atom, selector } from "recoil";

import { cerfaStatusGetter } from "./formEngine/atoms";
// import { documentsCompletionStatusGetter } from "./TransmissionFichier/documentsAtoms";

export const dossierCompletionStatus = selector({
  key: "dossierCompletionStatus",
  get: ({ get }) => {
    const cerfaCompletionStatus: any = get(cerfaStatusGetter);
    // const documentsCompletionStatus = get(documentsCompletionStatusGetter);
    return {
      cerfa: {
        completion: cerfaCompletionStatus?.completion,
        complete: cerfaCompletionStatus?.completion === 100,
      },
      // documents: documentsCompletionStatus,
      dossier: {
        // complete: cerfaCompletionStatus?.completion + documentsCompletionStatus?.completion === 200,
        // completion: (cerfaCompletionStatus?.completion + documentsCompletionStatus?.completion) / 2,
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
