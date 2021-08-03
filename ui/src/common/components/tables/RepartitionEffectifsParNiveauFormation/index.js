import { Tbody, Td, Tr } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { getPercentage } from "../../../utils/calculUtils";
import ProgressCell from "../ProgressCell";
import Table from "../Table";

const RepartitionEffectifsParNiveauFormation = ({ repartitionEffectifs, loading, error }) => {
  return (
    <Table
      headers={["Niveau", "apprentis", "inscrits sans contrat", "rupturants", "abandons"]}
      loading={loading}
      error={error}
    >
      <Tbody>
        {repartitionEffectifs
          ? repartitionEffectifs.map(({ niveauFormation, effectifs }, index) => {
              const total =
                effectifs.abandons + effectifs.apprentis + effectifs.inscritsSansContrat + effectifs.rupturants;
              return (
                <Tr key={niveauFormation + index}>
                  <Td color="grey.800">Niveau {niveauFormation}</Td>
                  <ProgressCell label={effectifs.apprentis} value={getPercentage(effectifs.apprentis, total)} />
                  <ProgressCell
                    label={effectifs.inscritsSansContrat}
                    value={getPercentage(effectifs.inscritsSansContrat, total)}
                  />
                  <ProgressCell label={effectifs.rupturants} value={getPercentage(effectifs.rupturants, total)} />
                  <ProgressCell label={effectifs.abandons} value={getPercentage(effectifs.abandons, total)} />
                </Tr>
              );
            })
          : null}
      </Tbody>
    </Table>
  );
};

RepartitionEffectifsParNiveauFormation.propTypes = {
  repartitionEffectifs: PropTypes.arrayOf(
    PropTypes.shape({
      niveauFormation: PropTypes.string.isRequired,
      effectifs: PropTypes.shape({
        apprentis: PropTypes.number.isRequired,
        inscritsSansContrat: PropTypes.number.isRequired,
        rupturants: PropTypes.number.isRequired,
        abandons: PropTypes.number.isRequired,
      }).isRequired,
    }).isRequired
  ),
  loading: PropTypes.bool,
  error: PropTypes.object,
};

export default RepartitionEffectifsParNiveauFormation;
