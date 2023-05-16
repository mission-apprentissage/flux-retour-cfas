import { Button, Flex, HStack } from "@chakra-ui/react";
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";

import { _get, _post, _put } from "@/common/httpClient";
import Stepper from "@/components/Stepper/Stepper";

import UploadFiles from "./engine/TransmissionFichier/components/UploadFiles";
import { useUploadedDocuments } from "./engine/TransmissionFichier/hooks/useUploadedDocuments";

type TeleversementsVerificationProps = {
  organismeId: string;
};

const TeleversementsVerification = ({ organismeId }: TeleversementsVerificationProps) => {
  const { data: documents, deleteDocument, uploadDocument } = useUploadedDocuments(organismeId);
  const router = useRouter();

  return (
    <>
      <Flex width="100%" justify="flex-start" mt={5} mb={10} flexDirection="column">
        <>
          <Stepper
            title="Vérification des données avant importation"
            nextTitle="Importation"
            currentStep={1}
            maxStep={4}
            paddingBottom={10}
          />
          TODO
          <HStack justify="flex-end">
            <Button
              as={Link}
              href={`${router.asPath}/mapping`}
              size={"md"}
              variant="primary"
              isDisabled={!documents?.length}
            >
              Suivant
            </Button>
          </HStack>
        </>
      </Flex>
    </>
  );
};

export default TeleversementsVerification;
