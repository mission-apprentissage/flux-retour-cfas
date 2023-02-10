import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRecoilState, useRecoilValue } from "recoil";

import { uploadsAtom } from "../../atoms";
import { documentsGetter } from "../documentsAtoms";
import { _get } from "../../../../../../common/httpClient";

export function useFetchUploads(organismeId) {
  const [, setUploads] = useRecoilState(uploadsAtom);
  const { isLoading, isFetching } = useQuery(
    ["fetchDocuments", organismeId],
    async () => {
      if (!organismeId) {
        return;
      }
      const uploads = await _get(`/api/v1/upload/get?organisme_id=${organismeId}`);
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
    },
    {
      refetchOnWindowFocus: false,
    }
  );

  return { isLoading: isFetching || isLoading };
}

export function useDocuments() {
  const documents = useRecoilValue(documentsGetter);
  const [uploads, setUploads] = useRecoilState(uploadsAtom);

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
