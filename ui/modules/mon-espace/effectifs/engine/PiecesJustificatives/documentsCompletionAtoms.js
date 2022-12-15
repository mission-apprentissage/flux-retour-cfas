import { selector } from "recoil";
import { valueSelector } from "../formEngine/atoms";
import { dossierAtom } from "../atoms";
import { documentsIsRequired } from "./domain/documentsIsRequired";

export const documentsCompletionStatusGetter = selector({
  key: "documentsCompletionStatus",
  get: ({ get }) => {
    const dossier = get(dossierAtom);
    const typeContratApp = get(valueSelector("contrat.typeContratApp"));
    const documentsRequired = documentsIsRequired(typeContratApp);
    if (!dossier) return;

    const docs = dossier.documents?.filter((i) => i.typeDocument === "CONVENTION_FORMATION");
    const attestationPiece = get(valueSelector("employeur.attestationPieces"));

    const nbFields = (documentsRequired ? 1 : 0) + 1;
    const nbFilled = (docs?.length && documentsRequired ? 1 : 0) + (attestationPiece ? 1 : 0);

    const completion = (nbFilled / nbFields) * 100;
    return {
      complete: completion === 100,
      completion,
    };
  },
});

export const documentsGetter = selector({
  key: "documentsGetter",
  get: ({ get }) => {
    const dossier = get(dossierAtom);
    return dossier?.documents?.filter((i) => i.typeDocument === "CONVENTION_FORMATION");
  },
});
