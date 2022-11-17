import React, { useCallback, useMemo, useState } from "react";
import { Box, HStack, Button, Heading, Input, ListItem, Text, List, useToast, Spinner, Link } from "@chakra-ui/react";
import { useDropzone } from "react-dropzone";
import { useRecoilValue } from "recoil";
import { _postFile, _delete } from "../../../../common/httpClient";
import { DownloadLine, File, Bin } from "../../../../theme/components/icons";
import { hasContextAccessTo } from "../../../../common/utils/rolesUtils";
import queryString from "query-string";
import { useDocuments } from "../hooks/useDocuments";
import { dossierAtom } from "../../atoms";

const endpoint = `${process.env.NEXT_PUBLIC_BASE_URL}/api`;

const baseStyle = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "20px",
  borderWidth: 2,
  borderColor: "#E5E5E5",
  borderStyle: "dashed",
  color: "#9c9c9c",
  transition: "border .24s ease-in-out",
};

const activeStyle = {
  borderColor: "#3a55d1",
};

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

const UploadFiles = ({ title, typeDocument }) => {
  const dossier = useRecoilValue(dossierAtom);
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const { documents, onDocumentsChanged } = useDocuments();

  const maxFiles = 1;

  const onDrop = useCallback(
    async (acceptedFiles) => {
      setUploadError(null);
      setIsSubmitting(true);

      try {
        const data = new FormData();
        data.append("file", acceptedFiles[0]);
        const { documents } = await _postFile(
          `${endpoint}/v1/upload?dossierId=${dossier._id}&typeDocument=${typeDocument}`,
          data
        );
        onDocumentsChanged(documents, typeDocument);
        toast({
          title: "Le fichier a bien été déposé",
          status: "success",
          duration: 4000,
        });
      } catch (e) {
        const messages = e.messages;
        setUploadError(`Une erreur est survenue : ${messages?.error ?? e.message}`);
        toast({
          title: `Une erreur est survenue : ${messages?.error ?? e.message}`,
          status: "error",
          duration: 8000,
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [dossier._id, onDocumentsChanged, toast, typeDocument]
  );

  const onDropRejected = useCallback(
    (rejections) => {
      setUploadError(`Ce fichier ne peut pas être déposé: ${rejections?.[0]?.errors?.[0]?.message}`);
      toast({
        title: `Ce fichier ne peut pas être déposé: ${rejections?.[0]?.errors?.[0]?.message}`,
        status: "error",
        duration: 5000,
      });
    },
    [toast]
  );

  const onDeleteClicked = async (file) => {
    if (hasContextAccessTo(dossier, "dossier/page_documents/supprimer_un_document")) {
      // eslint-disable-next-line no-restricted-globals
      const remove = confirm("Voulez-vous vraiment supprimer ce document ?");
      if (remove) {
        try {
          let data = file;
          const { documents } = await _delete(
            `${endpoint}/v1/upload?dossierId=${dossier._id}&${queryString.stringify(data)}`
          );
          onDocumentsChanged(documents, typeDocument);
        } catch (e) {
          console.error(e);
        }
      }
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    maxFiles,
    onDrop,
    onDropRejected,
    accept: ".pdf",
    maxSize: 10485760,
  });

  const style = useMemo(
    () => ({
      ...baseStyle,
      ...(isDragActive ? activeStyle : {}),
    }),
    [isDragActive]
  );

  return (
    <>
      <Heading as="h3" flexGrow="1" fontSize="1.2rem" mb={4}>
        {title}
      </Heading>
      <Box mb={8}>
        {uploadError && <Text color="error">{uploadError}</Text>}
        {documents.length > 0 && (
          <>
            <List>
              {documents.map((file) => {
                return (
                  <ListItem key={file.path || file.nomFichier} borderBottom="solid 1px" borderColor="dgalt" pb={3}>
                    <HStack>
                      <File boxSize="5" color="bluefrance" />
                      <Box flexGrow={1}>
                        <Link
                          href={`/api/v1/upload?dossierId=${dossier._id}&path=${file.cheminFichier}&name=${file.nomFichier}`}
                          textDecoration={"underline"}
                          isExternal
                        >
                          {file.path || file.nomFichier} - {formatBytes(file.size || file.tailleFichier)}
                        </Link>
                      </Box>
                      {dossier.draft && (
                        <Bin boxSize="5" color="redmarianne" cursor="pointer" onClick={() => onDeleteClicked(file)} />
                      )}
                    </HStack>
                  </ListItem>
                );
              })}
            </List>
          </>
        )}
      </Box>
      {dossier.draft && (
        <Box {...getRootProps({ style })} mb={8}>
          {!isSubmitting && (
            <>
              <Input {...getInputProps()} />
              {isDragActive ? (
                <Text>Glissez et déposez ici ...</Text>
              ) : (
                <>
                  <DownloadLine boxSize="4" color="bluefrance" mb={4} />
                  <Text color="mgalt">
                    Glissez le fichier dans cette zone ou cliquez sur le bouton pour ajouter un document depuis votre
                    disque dur
                  </Text>
                  <Text color="mgalt">(pdf uniquement, maximum 10mb)</Text>
                  <Button size="md" variant="secondary" mt={4}>
                    Ajouter un document
                  </Button>
                </>
              )}
            </>
          )}
          {isSubmitting && <Spinner />}
        </Box>
      )}
    </>
  );
};
export default UploadFiles;
