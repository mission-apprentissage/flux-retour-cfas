import { Box, Button, Center, Flex, Heading, HStack, Text } from "@chakra-ui/react";
import { useRouter } from "next/router";
import React from "react";

import { configureOrganismeERP } from "@/common/api/tableauDeBord";
import Ribbons from "@/components/Ribbons/Ribbons";
import { ArrowDropRightLine } from "@/theme/components/icons";

type ChoixTransmissionProps = {
  organismeId: string;
  isMine: boolean;
};

const ChoixTransmission = ({ organismeId, isMine = false }: ChoixTransmissionProps) => {
  const router = useRouter();

  return (
    <>
      <Box my={9} color="bluesoft.500" fontWeight="700">
        <Ribbons variant="warning" mt={5}>
          <Box pl={3}>Vous n’avez pas encore transmis de données</Box>
        </Ribbons>
      </Box>

      <Flex width="100%" justify="flex-start" mt={5} mb={10} flexDirection="column">
        <HStack>
          <Text fontWeight="700">Comment aimeriez-vous importer vos effectifs ?</Text>
        </HStack>
        <HStack spacing={12} justifyContent="center" mt={5}>
          <Flex
            flexDirection="column"
            borderWidth="1px"
            borderColor="dgalt"
            p={10}
            w="33%"
            h="30vh"
            borderBottomWidth="4px"
            borderBottomColor="bluefrance"
          >
            <Box flexGrow="1">
              <Flex flexDirection="column" alignItems="flex-start" p={0}>
                <Heading as="h4" fontSize="1.5rem" mb={4}>
                  Vous avez un ERP ?
                </Heading>
                <Heading as="h5" fontSize="1rem" mb={4}>
                  Liez votre ou vos ERP au tableau de bord
                </Heading>
              </Flex>
            </Box>
            <Center h="10%">
              <Button
                onClick={async () => {
                  await configureOrganismeERP(organismeId, { mode_de_transmission: "API" });
                  router.reload();
                }}
                size={"md"}
                variant={"secondary"}
              >
                Choisir cette méthode
                <ArrowDropRightLine w={"0.75rem"} h={"0.75rem"} mt={"0.250rem"} ml="0.5rem" />
              </Button>
            </Center>
          </Flex>
          <Flex
            flexDirection="column"
            borderWidth="1px"
            borderColor="dgalt"
            p={10}
            w="33%"
            h="30vh"
            borderBottomWidth="4px"
            borderBottomColor="bluefrance"
          >
            <Box flexGrow="1">
              <Flex flexDirection="column" alignItems="flex-start" p={0}>
                <Heading as="h4" fontSize="1.5rem" mb={4}>
                  Vous n&rsquo;avez pas d&rsquo;ERP ?
                </Heading>
                <Heading as="h5" fontSize="1rem" mb={4}>
                  Importez vos effectifs avec un fichier Excel
                </Heading>
              </Flex>
            </Box>
            <Center h="10%">
              <Button
                onClick={async () => {
                  if (!isMine) {
                    router.push(`/organismes/${organismeId}/effectifs/televersement`);
                  } else {
                    router.push(`/effectifs/televersement`);
                  }
                }}
                size={"md"}
                variant={"secondary"}
              >
                Choisir cette méthode
                <ArrowDropRightLine w={"0.75rem"} h={"0.75rem"} mt={"0.250rem"} ml="0.5rem" />
              </Button>
            </Center>
          </Flex>
        </HStack>
      </Flex>
    </>
  );
};

export default ChoixTransmission;
