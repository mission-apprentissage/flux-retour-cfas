import { Tbody } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { useFiltersContext } from "../../../../pages/tableau-de-bord/FiltersContext";
import { isDateFuture } from "../../../utils/dateUtils";
import Table from "../Table";
import NiveauFormationRow from "./NiveauFormationRow";

const RepartitionEffectifsParFormation = ({ repartitionEffectifs, loading, error }) => {
  const filtersContext = useFiltersContext();
  const shouldHideEffectifs = isDateFuture(filtersContext.state.date);
  return (
    <>
      {shouldHideEffectifs === false && (
        <Table
          headers={["Niveau", "apprentis", "inscrits sans contrat", "rupturants", "abandons"]}
          loading={loading}
          error={error}
        >
          <Tbody>
            {repartitionEffectifs
              ? repartitionEffectifs.map((data) => {
                  return (
                    <NiveauFormationRow
                      key={data.niveauFormation}
                      niveauFormation={data.niveauFormation}
                      effectifs={data.effectifs}
                    />
                  );
                })
              : null}
          </Tbody>
        </Table>
      )}
      {shouldHideEffectifs === true && (
        <Table headers={["Niveau", "apprentis", "inscrits sans contrat"]} loading={loading} error={error}>
          <Tbody>
            {repartitionEffectifs
              ? repartitionEffectifs.map((data) => {
                  return (
                    <NiveauFormationRow
                      key={data.niveauFormation}
                      niveauFormation={data.niveauFormation}
                      effectifs={data.effectifs}
                    />
                  );
                })
              : null}
          </Tbody>
        </Table>
      )}
    </>
  );
};

RepartitionEffectifsParFormation.propTypes = {
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

export default RepartitionEffectifsParFormation;
