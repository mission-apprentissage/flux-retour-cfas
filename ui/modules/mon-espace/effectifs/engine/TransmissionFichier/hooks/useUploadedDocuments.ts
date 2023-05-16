import { useMutation, useQuery } from "@tanstack/react-query";

import { _delete, _get, _postFile } from "@/common/httpClient";

export type UploadedDocument = {
  document_id: string;
  ext_fichier: string;
  nom_fichier: string;
  chemin_fichier: string;
  taille_fichier: number;
  hash_fichier: string;
  confirm: boolean;
  created_at: string;
  updated_at: string;
  added_by: string;
};

export function useUploadedDocuments(organismeId: string) {
  // DOCUMENTS LIST
  const { isLoading, isFetching, data, refetch } = useQuery(["fetchDocuments", organismeId], async () => {
    if (!organismeId) {
      return;
    }
    const uploads = await _get<{ documents: UploadedDocument[] }>(`/api/v1/organismes/${organismeId}/upload/get`);

    return uploads.documents?.filter((d) => !d.confirm) || [];
  });

  // DELETION
  const { mutateAsync: deleteDocument } = useMutation(async (document_id: string) => {
    const { documents, models } = await _delete(`/api/v1/organismes/${organismeId}/upload/doc/${document_id}`);
    console.log({ documents, models });
    await refetch();
    return { documents, models };
  });

  // UPLOAD
  const { mutateAsync: uploadDocument } = useMutation(async (file: File) => {
    const data = new FormData();
    data.append("file", file);
    const { documents, models } = await _postFile(`/api/v1/organismes/${organismeId}/upload`, data);
    await refetch();
    return { documents, models };
  });

  return {
    isLoading: isFetching || isLoading,
    data: data || [],
    deleteDocument,
    uploadDocument,
  };
}
