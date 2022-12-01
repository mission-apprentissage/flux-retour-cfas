import React from "react";
import { Button, Flex, HStack, Text } from "@chakra-ui/react";
import { ArrowDropRightLine } from "../../../theme/components/icons";
import { useOrganisme } from "../../../hooks/useOrganisme";

const TransmissionAPI = () => {
  const { organisme, updateOrganisme } = useOrganisme();

  return (
    <>
      <Flex width="100%" justify="flex-start" mt={5} mb={10} flexDirection="column">
        <HStack>
          <Text fontWeight="700">STUFF ABOUT HOW TO ERP</Text>
        </HStack>
        <Button
          onClick={() => updateOrganisme(organisme.id, { setup_step_courante: "COMPLETE" })}
          size={"md"}
          variant={"secondary"}
        >
          Étape suivante (installation terminée après toutes les étapes de step by step)
          <ArrowDropRightLine w={"0.75rem"} h={"0.75rem"} mt={"0.250rem"} ml="0.5rem" />
        </Button>
      </Flex>
    </>
  );
};

export default TransmissionAPI;
