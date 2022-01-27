import { Tbody, Td, Tr } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { useFiltersContext } from "../../../../pages/tableau-de-bord/FiltersContext";
import { getPercentage } from "../../../utils/calculUtils";
import { isDateFuture } from "../../../utils/dateUtils";
import ProgressCell from "../ProgressCell";
import Table from "../Table";

const RepartitionEffectifsParNiveauFormation = ({ repartitionEffectifs, loading, error }) => {
  const filtersContext = useFiltersContext();
  const isPeriodInvalid = isDateFuture(filtersContext.state.date);

  const tableHeader = isPeriodInvalid
    ? ["Niveaux de formation", "apprentis", "inscrits sans contrat"]
    : ["Niveaux de formation", "apprentis", "inscrits sans contrat", "rupturants", "abandons"];
  return (
    <Table headers={tableHeader} loading={loading} error={error}>
      <Tbody>
        {repartitionEffectifs
          ? repartitionEffectifs.map(({ niveauFormation, niveauFormationLibelle, effectifs }, index) => {
              const total =
                effectifs.abandons + effectifs.apprentis + effectifs.inscritsSansContrat + effectifs.rupturants;
              return (
                <Tr key={niveauFormation + index}>
                  <Td color="grey.800">Niveau {niveauFormationLibelle}</Td>
                  <ProgressCell label={effectifs.apprentis} value={getPercentage(effectifs.apprentis, total)} />
                  <ProgressCell
                    label={effectifs.inscritsSansContrat}
                    value={getPercentage(effectifs.inscritsSansContrat, total)}
                  />
                  {!isPeriodInvalid && (
                    <>
                      <ProgressCell label={effectifs.rupturants} value={getPercentage(effectifs.rupturants, total)} />
                      <ProgressCell label={effectifs.abandons} value={getPercentage(effectifs.abandons, total)} />
                    </>
                  )}
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
      niveauFormationLibelle: PropTypes.string.isRequired,
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
