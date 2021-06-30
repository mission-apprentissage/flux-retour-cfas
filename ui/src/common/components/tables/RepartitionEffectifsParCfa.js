import { HStack, Progress, Tbody, Td, Text, Tr } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { getPercentage } from "../../../common/utils/calculUtils";
import Table from "./Table";

const RepartitionEffectifsParCfa = ({ repartitionEffectifsParCfa, loading, error }) => {
  let content = null;

  if (repartitionEffectifsParCfa) {
    content = (
      <Tbody>
        {repartitionEffectifsParCfa.map((item, index) => {
          const { siret_etablissement, uai_etablissement, nom_etablissement, effectifs } = item;
          const total = effectifs.abandons + effectifs.apprentis + effectifs.inscrits;
          return (
            <Tr key={"headerRow_" + index}>
              <Td color="grey.800">{uai_etablissement}</Td>
              <Td color="grey.800">{siret_etablissement}</Td>
              <Td color="grey.800">{nom_etablissement}</Td>
              <Td>
                <HStack>
                  <Progress
                    width="3rem"
                    size="sm"
                    colorScheme="main"
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
                    colorScheme="main"
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
                    colorScheme="main"
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
    );
  }

  return (
    <Table
      headers={["UAI", "SIRET", "Nom de l'organisme", "apprentis", "apprenants sans contrat", "abandons"]}
      loading={loading}
      error={error}
    >
      {content}
    </Table>
  );
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
