import {
  Box,
  Center,
  Flex,
  HStack,
  Heading,
  Spinner,
  TableContainer,
  Tbody,
  Table,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  Stack,
  Select,
  Divider,
  Button,
} from "@chakra-ui/react";
import React from "react";
import { useRecoilValue } from "recoil";

import { _get } from "@/common/httpClient";
import { toPascalCase } from "@/common/utils/stringUtils";
import Link from "@/components/Links/Link";
import { organismeAtom } from "@/hooks/organismeAtoms";

import { useOrganismesDuplicatesEffectifs } from "./useDuplicateEffectifsOrganisme";

const EffectifsDoublonsPage = ({ isMine }) => {
  const organisme = useRecoilValue<any>(organismeAtom);
  const { organismesDuplicatesEffectifs, isLoading } = useOrganismesDuplicatesEffectifs(organisme?._id);

  if (isLoading) {
    return (
      <Center>
        <Spinner />
      </Center>
    );
  }

  if (!organisme) return null;

  return (
    <Flex flexDir="column" width="100%">
      <Heading textStyle="h2" color="grey.800">
        {isMine ? "Mes effectifs" : "Ses effectifs"}
      </Heading>

      <HStack mb={6}>
        <Link
          href={`/organismes/${organisme?._id}/effectifs`}
          color="bluefrance"
          borderBottom="1px solid"
          mt={2}
          _hover={{ cursor: "pointer", textDecoration: "none", borderBottom: "2px solid" }}
        >
          <Box as="i" className="ri-arrow-left-line" marginRight="1w" />
          Retour au tableau des effectifs
        </Link>
      </HStack>

      <Stack>
        {/* Zone a traiter */}
        <Stack spacing={6}>
          <Text color="grey.800" fontSize="1.1rem" fontWeight="bold" mb={4}>
            Vérifier les effectifs en double
          </Text>

          {/* Temp ToRemove */}
          <p>{JSON.stringify(organismesDuplicatesEffectifs)}</p>

          <TableContainer>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Contact 1</Th>
                  <Th>Contact 2</Th>
                  <Th>Comparer</Th>
                  <Th>Action</Th>
                </Tr>
              </Thead>
              <Tbody>
                {organismesDuplicatesEffectifs.map((item, index) => (
                  <Tr key={index}>
                    <Td>{`${toPascalCase(item["_id"].prenom_apprenant)} ${toPascalCase(
                      item["_id"].nom_apprenant
                    )}`}</Td>
                    <Td>{`${toPascalCase(item["_id"].prenom_apprenant)} ${toPascalCase(
                      item["_id"].nom_apprenant
                    )}`}</Td>
                    <Td>
                      <Link
                        href={`/organismes/${organisme?._id}/effectifs`}
                        color="bluefrance"
                        borderBottom="1px solid"
                      >
                        <HStack>
                          <Box as="i" className="ri-eye-line" />
                          <Text>Comparer</Text>
                        </HStack>
                      </Link>
                    </Td>
                    <Td>
                      <Select placeholder="Selectionner une option">
                        <option value="option1">Conserver le contact 1</option>
                        <option value="option1">Conserver le contact 2</option>
                        <option value="option1">Conserver les deux</option>
                        <option value="option1">Ignorer le doublon</option>
                      </Select>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>

          <Flex flexDir="row-reverse">
            <Button mr={6} size="md" variant="primary">
              <Text as="span">Valider</Text>
            </Button>
          </Flex>
        </Stack>

        <Divider mt={6} mb={4} />

        {/* Zone ignorés */}
        <Stack spacing={8}>
          <Text color="grey.800" fontSize="1.1rem" fontWeight="bold">
            Ignorés précédemment
          </Text>

          <TableContainer>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Contact 1</Th>
                  <Th>Contact 2</Th>
                  <Th>Comparer</Th>
                  <Th>Action</Th>
                </Tr>
              </Thead>
              <Tbody>
                {organismesDuplicatesEffectifs.map((item, index) => (
                  <Tr key={index}>
                    <Td>{`${toPascalCase(item["_id"].prenom_apprenant)} ${toPascalCase(
                      item["_id"].nom_apprenant
                    )}`}</Td>
                    <Td>{`${toPascalCase(item["_id"].prenom_apprenant)} ${toPascalCase(
                      item["_id"].nom_apprenant
                    )}`}</Td>
                    <Td>
                      <Link
                        href={`/organismes/${organisme?._id}/effectifs`}
                        color="bluefrance"
                        borderBottom="1px solid"
                      >
                        <HStack>
                          <Box as="i" className="ri-eye-line" />
                          <Text>Comparer</Text>
                        </HStack>
                      </Link>
                    </Td>
                    <Td>
                      <Select placeholder="Selectionner une option">
                        <option value="option1">Conserver le contact 1</option>
                        <option value="option1">Conserver le contact 2</option>
                        <option value="option1">Conserver les deux</option>
                        <option value="option1">Ignorer le doublon</option>
                      </Select>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>

          <Flex flexDir="row-reverse">
            <Button mr={6} size="md" variant="secondary">
              <Text as="span">Valider</Text>
            </Button>
          </Flex>
        </Stack>
      </Stack>
    </Flex>
  );
};

export default EffectifsDoublonsPage;
