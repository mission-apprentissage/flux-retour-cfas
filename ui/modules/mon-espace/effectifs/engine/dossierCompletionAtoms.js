import { selector } from "recoil";
import { cerfaStatusGetter } from "./formEngine/atoms";
import { documentsCompletionStatusGetter } from "./PiecesJustificatives/documentsCompletionAtoms";

export const dossierCompletionStatus = selector({
  key: "dossierCompletionStatus",
  get: ({ get }) => {
    const cerfaCompletionStatus = get(cerfaStatusGetter);
    const documentsCompletionStatus = get(documentsCompletionStatusGetter);
    // const signatureCompletionStatus = get(documentsCompletionStatusGetter);
    return {
      cerfa: {
        completion: cerfaCompletionStatus?.completion,
        complete: cerfaCompletionStatus?.completion === 100,
      },
      documents: documentsCompletionStatus,
      signature: {
        completion: 0,
        complete: false,
      },
      dossier: {
        complete: cerfaCompletionStatus?.completion + documentsCompletionStatus?.completion + 0 === 300,
        completion: (cerfaCompletionStatus?.completion + documentsCompletionStatus?.completion + 0) / 3,
      },
    };
  },
});
