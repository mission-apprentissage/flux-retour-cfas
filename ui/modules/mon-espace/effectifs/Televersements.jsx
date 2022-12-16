import React, { useState } from "react";
import { Button, Flex } from "@chakra-ui/react";
import { ArrowDropRightLine } from "../../../theme/components/icons";
// import { useOrganisme } from "../../../hooks/useOrganisme";
import UploadFiles from "./engine/TransmissionFichier/components/UploadFiles";
import { useFetchUploads } from "./engine/TransmissionFichier/hooks/useDocuments";

const Televersements = () => {
  // const { organisme, updateOrganisme } = useOrganisme();
  useFetchUploads();
  const [step, setStep] = useState(0);

  return (
    <>
      <Flex width="100%" justify="flex-start" mt={5} mb={10} flexDirection="column">
        {step === 0 && (
          <>
            <UploadFiles title={`Téléverser vos fichiers`} />

            <Button onClick={() => setStep(1)} size={"md"} variant="primary">
              Étape suivante
              <ArrowDropRightLine w={"0.75rem"} h={"0.75rem"} mt={"0.250rem"} ml="0.5rem" />
            </Button>
          </>
        )}
      </Flex>
    </>
  );
};

export default Televersements;
