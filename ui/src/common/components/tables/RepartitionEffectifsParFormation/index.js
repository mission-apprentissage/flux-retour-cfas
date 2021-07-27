import { Tbody } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import Table from "../Table";
import NiveauFormationRow from "./NiveauFormationRow";

const RepartitionEffectifsParFormation = ({ repartitionEffectifs, loading, error }) => {
  return (
    <Table
      headers={["Niveau", "apprentis", "jeunes sans contrat", "rupturants", "abandons"]}
      loading={loading}
      error={error}
    >
      <Tbody>
        {repartitionEffectifs
          ? repartitionEffectifs.map((data) => {
              return (
                <NiveauFormationRow
                  key={data.niveau_formation}
                  niveauFormation={data.niveau_formation}
                  effectifs={data.effectifs}
                />
              );
            })
          : null}
      </Tbody>
    </Table>
  );
};

RepartitionEffectifsParFormation.propTypes = {
  repartitionEffectifs: PropTypes.arrayOf(
    PropTypes.shape({
      niveauFormation: PropTypes.string.isRequired,
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

export default RepartitionEffectifsParFormation;
