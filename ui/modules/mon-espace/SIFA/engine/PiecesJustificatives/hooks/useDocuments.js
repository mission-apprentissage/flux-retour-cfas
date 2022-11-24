import { useCallback } from "react";
import { useRecoilState, useRecoilValue } from "recoil";

import { documentsGetter } from "../documentsCompletionAtoms";
import { dossierAtom } from "../../atoms";
import { documentsIsRequired } from "../domain/documentsIsRequired";
import { valueSelector } from "../../formEngine/atoms";

export function useDocuments() {
  const documents = useRecoilValue(documentsGetter);
  const [dossier, setDossier] = useRecoilState(dossierAtom);

  const typeContratApp = useRecoilValue(valueSelector("contrat.typeContratApp"));
  const required = documentsIsRequired(typeContratApp);

  const onDocumentsChanged = useCallback(
    async (newDocumentsArray, typeDocument) => {
      const docs = newDocumentsArray.filter((i) => i.typeDocument === typeDocument);
      setDossier({ ...dossier, documents: docs });
    },
    [dossier, setDossier]
  );

  return {
    documents,
    onDocumentsChanged,
    required,
  };
}
