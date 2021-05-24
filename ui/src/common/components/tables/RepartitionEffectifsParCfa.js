import { Box, HStack, Progress, Table, Tbody, Td, Text, Th, Thead, Tr } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { getPercentage } from "../../../common/utils/calculUtils";
import { TableSkeleton } from "../";

const TABLE_HEADERS = ["UAI", "SIRET", "Nom de l'organisme", "Apprentis", "Apprenants sans contrat", "Abandons"];

const RepartitionEffectifsParCfa = ({ repartitionEffectifsParCfa, loading, error }) => {
  if (loading) {
    return <TableSkeleton headers={TABLE_HEADERS} />;
  }

  if (error) {
    return (
      <Text fontSize="epsilon" color="grey.800">
        <Box as="i" className="ri-error-warning-fill" verticalAlign="middle" marginRight="1v" />
        <Box as="span" verticalAlign="middle">
          Erreur lors de la récupération de la répartition par organismes de formation
        </Box>
      </Text>
    );
  }

  if (repartitionEffectifsParCfa) {
    return (
      <Table mt="5">
        <Thead>
          <Tr background="bluesoft.100">
            {TABLE_HEADERS.map((header) => {
              return (
                <Th
                  key={header}
                  textTransform="initial"
                  textColor="grey.600"
                  fontSize="epsilon"
                  fontWeight="400"
                  letterSpacing="0px"
                >
                  {header}
                </Th>
              );
            })}
          </Tr>
        </Thead>
        <Tbody>
          {repartitionEffectifsParCfa.map((item, index) => {
            const { siret_etablissement, uai_etablissement, nom_etablissement, effectifs } = item;
            const total = effectifs.abandons + effectifs.apprentis + effectifs.inscrits;
            return (
              <Tr key={"headerRow_" + index} background="bluesoft.50">
                <Td textColor="black">{uai_etablissement}</Td>
                <Td textColor="black">{siret_etablissement}</Td>
                <Td textColor="black">{nom_etablissement}</Td>
                <Td>
                  <HStack>
                    <Progress
                      width="3rem"
                      size="sm"
                      colorScheme="orangesoft"
                      value={getPercentage(effectifs.apprentis, total)}
                      borderRadius="8px"
                    />{" "}
                    <Text color="grey.800" fontSize="delta" fontWeight="700">
                      {effectifs.apprentis}
                    </Text>
                  </HStack>
                </Td>
                <Td>
                  <HStack>
                    <Progress
                      width="3rem"
                      size="sm"
                      colorScheme="pinklight"
                      borderRadius="8px"
                      value={getPercentage(effectifs.inscrits, total)}
                    />{" "}
                    <Text color="grey.800" fontSize="delta" fontWeight="700">
                      {effectifs.inscrits}
                    </Text>
                  </HStack>
                </Td>
                <Td>
                  <HStack>
                    <Progress
                      width="3rem"
                      size="sm"
                      colorScheme="bluedark"
                      borderRadius="8px"
                      value={getPercentage(effectifs.abandons, total)}
                    />{" "}
                    <Text color="grey.800" fontSize="delta" fontWeight="700">
                      {effectifs.abandons}
                    </Text>
                  </HStack>
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    );
  }

  return null;
};

RepartitionEffectifsParCfa.propTypes = {
  repartitionEffectifsParCfa: PropTypes.arrayOf(
    PropTypes.shape({
      siret_etablissement: PropTypes.string.isRequired,
      uai_etablissement: PropTypes.string,
      nom_etablissement: PropTypes.string.isRequired,
      effectifs: PropTypes.shape({
        apprentis: PropTypes.number.isRequired,
        inscrits: PropTypes.number.isRequired,
        abandons: PropTypes.number.isRequired,
      }).isRequired,
    }).isRequired
  ),
  loading: PropTypes.bool,
  error: PropTypes.object,
};

export default RepartitionEffectifsParCfa;
