import { VStack, Spinner, Input, Button, Text, Box } from "@chakra-ui/react";
import { useMemo } from "react";

import { UploadLine } from "@/theme/components/icons";

export default function FileUploadComponent({ isSubmitting, getRootProps, getInputProps, isDragActive }) {
  const style = useMemo(
    () => ({
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "20px",
      borderWidth: 2,
      borderColor: "#000091",
      borderStyle: "dashed",
      borderRadius: 6,
      color: "#9c9c9c",
      transition: "border .24s ease-in-out",
      ...(isDragActive ? { borderColor: "#3a55d1" } : {}),
    }),
    [isDragActive]
  );

  return (
    <>
      <Text fontWeight="bold" fontSize={20}>
        Sélectionner un document à importer
      </Text>
      <VStack align="start" mt={3} spacing={0}>
        <Text>Sélectionner un fichier contenant vos effectifs à importer (maximum 2000).</Text>
        <Text>Si vous utilisez plusieurs fichiers, merci d’importer vos documents un par un.</Text>
      </VStack>
      <Box {...getRootProps({ style })} my={8} minH="200px">
        {isSubmitting ? (
          <Box textAlign="center" flex="1" flexDirection="column">
            <Spinner />
            <Text mt={2}>Veuillez patienter quelques secondes</Text>
          </Box>
        ) : (
          <>
            <Input {...getInputProps()} />
            {isDragActive ? (
              <Text>Glissez et déposez ici ...</Text>
            ) : (
              <>
                <UploadLine boxSize="4" color="bluefrance" mb={4} />
                <Text color="mgalt">Glissez le fichier dans cette zone ou cliquez sur le bouton</Text>
                <Text color="mgalt">pour ajouter un document Excel (xlsx) depuis votre disque dur</Text>
                <Button size="md" variant="secondary" mt={4}>
                  Ajouter un document
                </Button>
              </>
            )}
          </>
        )}
      </Box>
    </>
  );
}
