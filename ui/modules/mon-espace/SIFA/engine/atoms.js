import { atom, selector } from "recoil";
import { cerfaStatusGetter } from "./formEngine/atoms";
import { documentsCompletionStatusGetter } from "./PiecesJustificatives/documentsCompletionAtoms";
import { signaturesCompletionSelector } from "./Signatures/atoms";

export const dossierCompletionStatus = selector({
  key: "dossierCompletionStatus",
  get: ({ get }) => {
    const cerfaCompletionStatus = get(cerfaStatusGetter);
    const documentsCompletionStatus = get(documentsCompletionStatusGetter);
    const signatureCompletionStatus = get(signaturesCompletionSelector);
    return {
      cerfa: {
        completion: cerfaCompletionStatus?.completion,
        complete: cerfaCompletionStatus?.completion === 100,
      },
      documents: documentsCompletionStatus,
      signature: signatureCompletionStatus,
      dossier: {
        complete:
          cerfaCompletionStatus?.completion +
            documentsCompletionStatus?.completion +
            signatureCompletionStatus.completion ===
          300,
        completion:
          (cerfaCompletionStatus?.completion +
            documentsCompletionStatus?.completion +
            signatureCompletionStatus.completion) /
          3,
      },
    };
  },
});

export const dossierAtom = atom({
  key: "dossierAtom",
  default: null,
});
