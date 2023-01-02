import React, { useCallback, useMemo, useState } from "react";
import { Box, HStack, Button, Heading, Input, ListItem, Text, List, useToast, Spinner, Link } from "@chakra-ui/react";
import { useDropzone } from "react-dropzone";
import { useRecoilValue } from "recoil";

import queryString from "query-string";
import { useDocuments } from "../hooks/useDocuments";
import { _delete, _postFile } from "../../../../../../common/httpClient";
import { hasContextAccessTo } from "../../../../../../common/utils/rolesUtils";
import { Bin, DownloadLine, File } from "../../../../../../theme/components/icons";
import { organismeAtom } from "../../../../../../hooks/organismeAtoms";

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

const UploadFiles = ({ title }) => {
  const organisme = useRecoilValue(organismeAtom);
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const { documents, onDocumentsChanged } = useDocuments();

  const type_document = "Foo";

  const maxFiles = 1;

  const onDrop = useCallback(
    async (acceptedFiles) => {
      setUploadError(null);
      setIsSubmitting(true);

      try {
        const data = new FormData();
        data.append("file", acceptedFiles[0]);
        const { documents } = await _postFile(
          `${endpoint}/v1/upload?organisme_id=${organisme._id}&type_document=${type_document}`,
          data
        );
        onDocumentsChanged(documents, type_document);
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
    [organisme?._id, onDocumentsChanged, toast, type_document]
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
    if (hasContextAccessTo(organisme, "organisme/page_effectifs/supprimer_un_document")) {
      // eslint-disable-next-line no-restricted-globals
      const remove = confirm("Voulez-vous vraiment supprimer ce document ?");
      if (remove) {
        try {
          let data = file;
          const { documents } = await _delete(
            `${endpoint}/v1/upload?organisme_id=${organisme._id}&${queryString.stringify(data)}`
          );
          onDocumentsChanged(documents, type_document);
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
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls", ".csv"],
      "text/csv": [".csv"],
    },
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
      <Heading as="h3" flexGrow="1" fontSize="1.2rem" mt={2} mb={5}>
        {title}
      </Heading>
      <Box mb={8}>
        {uploadError && <Text color="error">{uploadError}</Text>}
        {documents?.unconfirmed?.length > 0 && (
          <>
            <List>
              {documents?.unconfirmed?.map((file) => {
                return (
                  <ListItem key={file.path || file.nom_fichier} borderBottom="solid 1px" borderColor="dgalt" pb={3}>
                    <HStack>
                      <File boxSize="5" color="bluefrance" />
                      <Box flexGrow={1}>
                        <Link
                          href={`/api/v1/upload?organisme_id=${organisme._id}&path=${file.chemin_fichier}&name=${file.nom_fichier}`}
                          textDecoration={"underline"}
                          isExternal
                        >
                          {file.path || file.nom_fichier} - {formatBytes(file.size || file.taille_fichier)}
                        </Link>
                      </Box>
                      <Bin boxSize="5" color="redmarianne" cursor="pointer" onClick={() => onDeleteClicked(file)} />
                    </HStack>
                  </ListItem>
                );
              })}
            </List>
          </>
        )}
      </Box>

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
                <Text color="mgalt">(Microsoft Excel (.xlsx ou .xls) ou .csv, maximum 10mb)</Text>
                <Button size="md" variant="secondary" mt={4}>
                  Ajouter un document
                </Button>
              </>
            )}
          </>
        )}
        {isSubmitting && <Spinner />}
      </Box>
    </>
  );
};
export default UploadFiles;
