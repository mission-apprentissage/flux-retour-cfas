import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRecoilState, useRecoilValue } from "recoil";

import { uploadsAtom } from "../../atoms";
import { documentsGetter } from "../documentsAtoms";
import { _get } from "../../../../../../common/httpClient";
import { organismeAtom } from "../../../../../../hooks/organismeAtoms";

export function useFetchUploads() {
  const [, setUploads] = useRecoilState(uploadsAtom);
  const organisme = useRecoilValue(organismeAtom);

  const { isLoading, isFetching } = useQuery(
    ["fetchDocuments"],
    async () => {
      const uploads = await _get(`/api/v1/upload/get?organisme_id=${organisme._id}`);
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
    async (newDocumentsArray) => {
      const docs = newDocumentsArray;
      setUploads({
        ...uploads,
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
    onDocumentsChanged,
  };
}
