import React from "react";
import { Box, Button, Center, Flex, Heading, HStack, ListItem, Text, UnorderedList } from "@chakra-ui/react";
import { ArrowDropRightLine } from "../../../theme/components/icons";

const ChoixTransmission = ({ onModeClicked }) => {
  return (
    <>
      <Box my={9} color="bluesoft.500" fontWeight="700">
        Vous n’avez pas encore transmis de données
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
                  Lié votre ou vos ERP au tableau de bord
                </Heading>
              </Flex>
              <UnorderedList>
                <ListItem>Pouquoi 1 ?</ListItem>
                <ListItem>Pouquoi 2 ? </ListItem>
                <ListItem>Pouquoi 3 ?</ListItem>
              </UnorderedList>
            </Box>
            <Center h="10%">
              <Button onClick={() => onModeClicked("erp")} size={"md"} variant={"secondary"}>
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
                  Téléverser votre fichier
                </Heading>
                <Heading as="h5" fontSize="1rem" mb={4}>
                  Laissez-vous guider à partir de votre fichier. Notre outil transforme rapidement au format souhaité.
                </Heading>
              </Flex>
              <UnorderedList>
                <ListItem>(Excel, csv...)</ListItem>
                <ListItem>Pouquoi 2 ? </ListItem>
                <ListItem>Pouquoi 3 ?</ListItem>
              </UnorderedList>
            </Box>
            <Center h="10%">
              <Button onClick={() => onModeClicked("file")} size={"md"} variant={"secondary"}>
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
                  Remplir à la main
                </Heading>
                <Heading as="h5" fontSize="1rem" mb={4}>
                  Astuce : Copiez / collez directement vos nouveaux contacts dans l’outil.
                </Heading>
              </Flex>
              <UnorderedList>
                <ListItem>Pouquoi 1 ?</ListItem>
                <ListItem>Pouquoi 2 ? </ListItem>
                <ListItem>Pouquoi 3 ?</ListItem>
              </UnorderedList>
            </Box>
            <Center h="10%">
              <Button onClick={() => onModeClicked("manuel")} size={"md"} variant={"secondary"}>
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
