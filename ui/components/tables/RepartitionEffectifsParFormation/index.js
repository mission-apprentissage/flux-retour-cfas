import { Tbody } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { isDateFuture } from "../../../common/utils/dateUtils";
import { useFiltersContext } from "../../../pages/app/visualiser-les-indicateurs/FiltersContext";
import Table from "../Table";
import NiveauFormationRow from "./NiveauFormationRow";

const RepartitionEffectifsParFormation = ({ repartitionEffectifs, loading, error }) => {
  const filtersContext = useFiltersContext();
  const isPeriodInvalid = isDateFuture(filtersContext.state.date);
  const tableHeader = isPeriodInvalid
    ? ["Niveau et année de la formation", "apprentis", "inscrits sans contrat"]
    : ["Niveau et année de la formation", "apprentis", "inscrits sans contrat", "rupturants", "abandons"];
  return (
    <Table headers={tableHeader} loading={loading} error={error}>
      <Tbody>
        {repartitionEffectifs
          ? repartitionEffectifs.map((data) => {
              return (
                <NiveauFormationRow
                  key={data.niveauFormation}
                  niveauFormation={data.niveauFormation}
                  niveauFormationLibelle={data.niveauFormationLibelle}
                  effectifs={data.effectifs}
                  isPeriodInvalid={isPeriodInvalid}
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

export default RepartitionEffectifsParFormation;
