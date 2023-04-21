import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { useRecoilState, useRecoilValue } from "recoil";

import { _get } from "@/common/httpClient";
import { uploadsAtom } from "@/modules/mon-espace/effectifs/engine/atoms";
import { documentsGetter } from "@/modules/mon-espace/effectifs/engine/TransmissionFichier/documentsAtoms";

export function useFetchUploads(organismeId) {
  const [, setUploads] = useRecoilState(uploadsAtom);
  const { isLoading, isFetching } = useQuery(["fetchDocuments", organismeId], async () => {
    if (!organismeId) {
      return;
    }
    const uploads = await _get(`/api/v1/organismes/${organismeId}/upload/get`);
    if (uploads.documents.length) {
      setUploads({
        ...uploads,
        documents: {
          confirmed: uploads.documents.filter((d) => d.confirm),
          unconfirmed: uploads.documents.filter((d) => !d.confirm),
        },
      });
    } else {
      setUploads({
        ...uploads,
        documents: {
          confirmed: [],
          unconfirmed: [],
        },
      });
    }

    return uploads;
  });

  return { isLoading: isFetching || isLoading };
}

export function useDocuments() {
  const documents = useRecoilValue<any>(documentsGetter);
  const [uploads, setUploads] = useRecoilState<any>(uploadsAtom);

  const onDocumentsChanged = useCallback(
    async (newDocumentsArray, models) => {
      const docs = newDocumentsArray;
      setUploads({
        ...uploads,
        models,
        documents: {
          confirmed: docs.filter((d) => d.confirm),
          unconfirmed: docs.filter((d) => !d.confirm),
        },
      });
    },
    [uploads, setUploads]
  );

  return {
    documents,
    uploads,
    onDocumentsChanged,
  };
}
