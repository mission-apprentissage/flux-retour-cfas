import { Box, Tbody, Td, Tr } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { getPercentage } from "../../../common/utils/calculUtils";
import ProgressCell from "./ProgressCell";
import Table from "./Table";

const RepartitionEffectifsParCfa = ({ repartitionEffectifsParCfa, loading, error }) => {
  let content = null;

  if (repartitionEffectifsParCfa) {
    content = (
      <Tbody>
        {repartitionEffectifsParCfa.map((item, index) => {
          const { uai_etablissement, nom_etablissement, effectifs } = item;
          const total = effectifs.abandons + effectifs.apprentis + effectifs.jeunesSansContrat + effectifs.rupturants;
          return (
            <Tr key={"headerRow_" + index}>
              <Td color="grey.800">
                <Box>{nom_etablissement}</Box>
                <Box fontSize="omega">UAI : {uai_etablissement}</Box>
              </Td>
              <ProgressCell label={effectifs.apprentis} value={getPercentage(effectifs.apprentis, total)} />
              <ProgressCell
                label={effectifs.jeunesSansContrat}
                value={getPercentage(effectifs.jeunesSansContrat, total)}
              />
              <ProgressCell label={effectifs.rupturants} value={getPercentage(effectifs.rupturants, total)} />
              <ProgressCell label={effectifs.abandons} value={getPercentage(effectifs.abandons, total)} />
            </Tr>
          );
        })}
      </Tbody>
    );
  }

  return (
    <Table
      headers={["Nom de l'organisme", "apprentis", "jeunes sans contrat", "rupturants", "abandons"]}
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
      uai_etablissement: PropTypes.string,
      nom_etablissement: PropTypes.string.isRequired,
      effectifs: PropTypes.shape({
        apprentis: PropTypes.number.isRequired,
        jeunesSansContrat: PropTypes.number.isRequired,
        rupturants: PropTypes.number.isRequired,
        abandons: PropTypes.number.isRequired,
      }).isRequired,
    }).isRequired
  ),
  loading: PropTypes.bool,
  error: PropTypes.object,
};

export default RepartitionEffectifsParCfa;
