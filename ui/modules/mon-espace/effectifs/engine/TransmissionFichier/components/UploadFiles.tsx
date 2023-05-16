import {
  Box,
  HStack,
  Button,
  Input,
  ListItem,
  Text,
  List,
  useToast,
  Spinner,
  UnorderedList,
  Heading,
} from "@chakra-ui/react";
import React, { useCallback, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";

import useServerEvents from "@/hooks/useServerEvents";
import { Bin, DownloadLine, File } from "@/theme/components/icons";

import { UploadedDocument } from "../hooks/useUploadedDocuments";

const MAX_FILE_SIZE = 10_485_760; // 10MB

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

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

type UploadFilesProps = {
  organismeId: string;
  documents: UploadedDocument[];
  onDocumentDelete: (document_id: string) => void;
  onDocumentUpload: (file: File) => void;
};

const UploadFiles = ({ organismeId, documents, onDocumentDelete, onDocumentUpload }: UploadFilesProps) => {
  const toast = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState<any>(null);
  const [lastMessage, resetServerEvent] = useServerEvents();

  const maxFiles = 1;

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!acceptedFiles.length) {
        return;
      }
      setUploadError(null);
      setIsSubmitting(true);

      try {
        await onDocumentUpload(acceptedFiles[0]);

        toast({
          title: "Le fichier a bien été déposé",
          status: "success",
          duration: 4000,
        });
      } catch (e) {
        const messages = e.messages;
        console.error(e);
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
    [organismeId, toast]
  );

  const onDropRejected = useCallback(
    (rejections) => {
      const error =
        rejections?.[0]?.errors?.[0].code === "file-too-large"
          ? `Ce fichier excède la taille maximale de ${formatBytes(MAX_FILE_SIZE)}`
          : `Ce fichier ne peut pas être déposé: ${rejections?.[0]?.errors?.[0]?.message}`;
      setUploadError(error);
      toast({
        title: error,
        status: "error",
        duration: 5000,
      });
    },
    [toast]
  );

  const onDeleteClicked = async (file: UploadedDocument) => {
    resetServerEvent();
    const remove = confirm("Voulez-vous vraiment supprimer ce document ?");
    if (remove) {
      onDocumentDelete(file.document_id);
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
    maxSize: MAX_FILE_SIZE,
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
      <Box mb={10}>
        <Heading as="h2" fontSize="gamma" color="labelgrey" mb={5}>
          Sélectionner un document à importer
        </Heading>
        <Text mb={5}>Sélectionner un fichier contenant vos effectifs à importer.</Text>
        <Text>Votre fichier doit inclure obligatoirement une ligne d’en-tête avec les champs suivants :</Text>
        <UnorderedList>
          <li>Code Formation Diplôme ou RNCP</li>
          <li>Année scolaire sur laquelle l’apprenant est positionné</li>
          <li>Nom de l’apprenant</li>
          <li>Prénom de l’apprenant</li>
        </UnorderedList>
      </Box>
      {documents?.length > 0 ? (
        <Box mb={8}>
          {uploadError && <Text color="error">{uploadError}</Text>}
          <>
            {isSubmitting ? (
              <Box textAlign="center" flex="1" flexDirection="column">
                <Spinner />
                <Text mt={2}>{lastMessage}</Text>{" "}
              </Box>
            ) : (
              <List>
                {documents?.map((file: any) => {
                  return (
                    <ListItem
                      key={file.path || file.nom_fichier}
                      border="solid 1px"
                      borderColor="bluefrance_light2"
                      borderRadius="4px"
                      p={4}
                    >
                      <HStack>
                        <File boxSize="5" color="bluefrance" />
                        <Box flexGrow={1}>
                          Nom du fichier : {file.path || file.nom_fichier} -{" "}
                          {formatBytes(file.size || file.taille_fichier)}
                        </Box>
                        <Bin boxSize="5" color="redmarianne" cursor="pointer" onClick={() => onDeleteClicked(file)} />
                      </HStack>
                    </ListItem>
                  );
                })}
              </List>
            )}
          </>
        </Box>
      ) : (
        <Box {...getRootProps<any>({ style })} mb={8} minH="200px">
          {isSubmitting ? (
            <Box textAlign="center" flex="1" flexDirection="column">
              <Spinner />
              <Text mt={2}>{lastMessage}</Text>
            </Box>
          ) : (
            <>
              <Input {...(getInputProps() as any)} />
              {isDragActive ? (
                <Text>Glissez et déposez ici ...</Text>
              ) : (
                <>
                  <DownloadLine boxSize="4" color="bluefrance" mb={4} />
                  <Text color="mgalt">
                    Glissez le fichier dans cette zone ou cliquez sur le bouton pour ajouter un document depuis votre
                    disque dur
                  </Text>
                  <Text color="mgalt">Formats acceptés : .csv (maximum 10mb)</Text>
                  <Button size="md" variant="secondary" mt={4}>
                    Ajouter un document
                  </Button>
                </>
              )}
            </>
          )}
        </Box>
      )}
    </>
  );
};
export default UploadFiles;
