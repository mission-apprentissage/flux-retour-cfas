import { Button, Flex, HStack, Heading, Text } from "@chakra-ui/react";
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";

import { _get, _post, _put } from "@/common/httpClient";
import Stepper from "@/components/Stepper/Stepper";

import UploadFiles from "./engine/TransmissionFichier/components/UploadFiles";
import { useUploadedDocuments } from "./engine/TransmissionFichier/hooks/useUploadedDocuments";

type TeleversementsFichiersProps = {
  organismeId: string;
};

const TeleversementsFichiers = ({ organismeId }: TeleversementsFichiersProps) => {
  const { data: documents, deleteDocument, uploadDocument } = useUploadedDocuments(organismeId);
  const router = useRouter();

  return (
    <>
      <Flex width="100%" justify="flex-start" mt={5} mb={10} flexDirection="column">
        <>
          <Stepper
            title="Déposer votre fichier"
            nextTitle="Traitement des données"
            currentStep={1}
            maxStep={4}
            paddingBottom={10}
          />

          <UploadFiles
            organismeId={organismeId}
            documents={documents}
            onDocumentDelete={(document_id) => deleteDocument(document_id)}
            onDocumentUpload={(file) => uploadDocument(file)}
          />

          {documents?.length > 0 && (
            <>
              <Heading as="h2" fontSize="gamma" color="labelgrey" mb={5}>
                Aperçu de votre fichier
              </Heading>
              <Text>
                Vérifiez que vous avez déposer le bon fichier (pas d&rsquo;action sur les données à ce stade).
              </Text>
              TODO
            </>
          )}
          <HStack justify="flex-end">
            <Button
              as={Link}
              href={`${router.asPath}/mapping`}
              size={"md"}
              variant="primary"
              isDisabled={!documents?.length}
            >
              {documents?.length ? "Confirmer" : "Suivant"}
            </Button>
          </HStack>
        </>
      </Flex>
    </>
  );
};

export default TeleversementsFichiers;
