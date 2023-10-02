import { selector } from "recoil";

import { EffectifFormStatusStatusGetter } from "./formEngine/atoms";
// import { documentsCompletionStatusGetter } from "./PiecesJustificatives/documentsCompletionAtoms";

export const dossierCompletionStatus = selector({
  key: "dossierCompletionStatus",
  get: ({ get }) => {
    const effectifFormCompletionStatus: any = get(EffectifFormStatusStatusGetter);
    // const documentsCompletionStatus = get(documentsCompletionStatusGetter);
    // const signatureCompletionStatus = get(documentsCompletionStatusGetter);
    return {
      effectifForm: {
        completion: effectifFormCompletionStatus?.completion,
        complete: effectifFormCompletionStatus?.completion === 100,
      },
      // documents: documentsCompletionStatus,
      signature: {
        completion: 0,
        complete: false,
      },
      dossier: {
        // complete: effectifFormCompletionStatus?.completion + documentsCompletionStatus?.completion + 0 === 300,
        // completion: (effectifFormCompletionStatus?.completion + documentsCompletionStatus?.completion + 0) / 3,
      },
    };
  },
});
