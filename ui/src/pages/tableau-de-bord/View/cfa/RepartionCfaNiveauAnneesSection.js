import { Center, HStack, Progress, Table, Tbody, Td, Text, Th, Thead, Tr } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import PageSectionTitle from "../../../../common/components/Page/PageSectionTitle";

const RepartionCfaNiveauAnneesSection = ({ repartitionsCfas }) => {
  return (
    <>
      <PageSectionTitle>Répartion par niveaux et années de formation</PageSectionTitle>
      {/* No data */}
      {!repartitionsCfas && (
        <>
          <Table mt="5">
            <Thead>
              <Tr background="orangesoft.300">
                <Th>Intitulé</Th>
                <Th>Année</Th>
                <Th>Apprentis</Th>
                <Th>Inscrits</Th>
                <Th>Abandons</Th>
              </Tr>
            </Thead>
            <Tbody>
              <Tr background="orangesoft.200">
                <Td colSpan="5">
                  <Center h="100px" p={4}>
                    <HStack fontSize="gamma">
                      <i className="ri-error-warning-fill"></i>
                      <Text>En cours de développement</Text>
                    </HStack>
                  </Center>
                </Td>
              </Tr>
            </Tbody>
          </Table>
        </>
      )}

      {/* TODO */}
      {repartitionsCfas && (
        <>
          <Table mt="5">
            <Thead>
              <Tr background="bluesoft.100">
                <Th>Intitulé</Th>
                <Th>Année</Th>
                <Th>Apprentis</Th>
                <Th>Inscrits</Th>
                <Th>Abandons</Th>
              </Tr>
            </Thead>
            <Tbody>
              <Tr background="bluesoft.50">
                <Td>Niveau 3 - CAP / BEP</Td>
                <Td></Td>
                <Td>
                  <HStack>
                    <Progress width="50%" colorScheme="orangesoft" value={80} />{" "}
                    <Text color="grey.800" fontSize="gamma" fontWeight="700">
                      127
                    </Text>
                    <Text color="bluefrance" fontSize="epsilon" fontWeight="700">
                      <span>+2 %</span>
                    </Text>
                  </HStack>
                </Td>
                <Td>
                  <HStack>
                    <Progress width="50%" colorScheme="pinklight" value={80} />{" "}
                    <Text color="grey.800" fontSize="gamma" fontWeight="700">
                      10
                    </Text>
                    <Text color="bluefrance" fontSize="epsilon" fontWeight="700">
                      <span>+2 %</span>
                    </Text>
                  </HStack>
                </Td>
                <Td>
                  <HStack>
                    <Progress width="50%" colorScheme="bluedark" value={80} />{" "}
                    <Text color="grey.800" fontSize="gamma" fontWeight="700">
                      2
                    </Text>
                    <Text color="bluefrance" fontSize="epsilon" fontWeight="700">
                      <span>-1 %</span>
                    </Text>
                  </HStack>
                </Td>
              </Tr>
            </Tbody>
            <Tbody>
              <Tr textAlign="left">
                <Td>CAP Boulanger</Td>
                <Td>1ère année</Td>
                <Td>
                  <HStack>
                    <Progress width="50%" colorScheme="orangesoft" value={80} />{" "}
                    <Text color="grey.800" fontSize="gamma" fontWeight="700">
                      127
                    </Text>
                    <Text color="bluefrance" fontSize="epsilon" fontWeight="700">
                      <span>+2 %</span>
                    </Text>
                  </HStack>
                </Td>
                <Td>
                  <HStack>
                    <Progress width="50%" colorScheme="pinklight" value={80} />{" "}
                    <Text color="grey.800" fontSize="gamma" fontWeight="700">
                      10
                    </Text>
                    <Text color="bluefrance" fontSize="epsilon" fontWeight="700">
                      <span>+2 %</span>
                    </Text>
                  </HStack>
                </Td>
                <Td>
                  <HStack>
                    <Progress width="50%" colorScheme="bluedark" value={80} />{" "}
                    <Text color="grey.800" fontSize="gamma" fontWeight="700">
                      2
                    </Text>
                    <Text color="bluefrance" fontSize="epsilon" fontWeight="700">
                      <span>-1 %</span>
                    </Text>
                  </HStack>
                </Td>
              </Tr>
            </Tbody>
          </Table>
        </>
      )}
    </>
  );
};

RepartionCfaNiveauAnneesSection.propTypes = {
  repartitionsCfas: PropTypes.shape({}),
};
export default RepartionCfaNiveauAnneesSection;
