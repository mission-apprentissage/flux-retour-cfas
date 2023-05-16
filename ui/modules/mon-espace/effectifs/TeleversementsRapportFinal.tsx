import { Button, Flex, HStack } from "@chakra-ui/react";
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";

import { _get, _post, _put } from "@/common/httpClient";
import Stepper from "@/components/Stepper/Stepper";

import UploadFiles from "./engine/TransmissionFichier/components/UploadFiles";
import { useUploadedDocuments } from "./engine/TransmissionFichier/hooks/useUploadedDocuments";

type TeleversementsRapportFinalProps = {
  organismeId: string;
};

const TeleversementsRapportFinal = ({ organismeId }: TeleversementsRapportFinalProps) => {
  const { data: documents, deleteDocument, uploadDocument } = useUploadedDocuments(organismeId);
  const router = useRouter();

  return (
    <>
      <Flex width="100%" justify="flex-start" mt={5} mb={10} flexDirection="column">
        <>TODO RAPPORT FINAL</>
      </Flex>
    </>
  );
};

export default TeleversementsRapportFinal;
