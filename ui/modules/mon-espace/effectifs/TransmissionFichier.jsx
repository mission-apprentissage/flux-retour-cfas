import React from "react";
import { Button, Flex, Text } from "@chakra-ui/react";
import { ArrowDropRightLine } from "../../../theme/components/icons";
import { useOrganisme } from "../../../hooks/useOrganisme";
import UploadFiles from "./engine/TransmissionFichier/components/UploadFiles";

const TransmissionFichier = () => {
  const { organisme, updateOrganisme } = useOrganisme();

  return (
    <>
      <Flex width="100%" justify="flex-start" mt={5} mb={10} flexDirection="column">
        <Text fontWeight="700" fontSize="1.3rem">
          TODO STUFF
        </Text>

        <UploadFiles title={`Téléverser vos fichiers`} />

        <Button
          onClick={() => updateOrganisme(organisme.id, { setup_step_courante: "COMPLETE" })}
          size={"md"}
          variant={"secondary"}
        >
          Étape suivante (Upload et vérif terminée)
          <ArrowDropRightLine w={"0.75rem"} h={"0.75rem"} mt={"0.250rem"} ml="0.5rem" />
        </Button>
      </Flex>
    </>
  );
};

export default TransmissionFichier;
