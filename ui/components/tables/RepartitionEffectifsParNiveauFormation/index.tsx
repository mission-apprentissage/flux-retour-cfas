import { Tbody, Td, Tr } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { useFiltersContext } from "@/modules/mon-espace/landing/visualiser-les-indicateurs/FiltersContext";
import { isDateFuture } from "../../../common/utils/dateUtils";
import NumberValueCell from "../NumberValueCell";
import Table from "../Table";

const RepartitionEffectifsParNiveauFormation = ({
  repartitionEffectifs,
  loading,
  error,
}: {
  repartitionEffectifs: any[];
  loading: boolean;
  error?: any;
}) => {
  const filtersContext = useFiltersContext();
  const isPeriodInvalid = isDateFuture(filtersContext.state.date);

  const tableHeader = isPeriodInvalid
    ? ["Liste des niveaux de formation", "apprentis", "inscrits sans contrat"]
    : ["Liste des niveaux de formation", "apprentis", "inscrits sans contrat", "rupturants", "abandons"];
  return (
    <Table headers={tableHeader} loading={loading} error={error}>
      <Tbody>
        {repartitionEffectifs
          ? repartitionEffectifs.map(({ niveauFormation, niveauFormationLibelle, effectifs }, index) => {
              return (
                <Tr key={niveauFormation + index}>
                  <Td color="grey.800">Niveau {niveauFormationLibelle}</Td>
                  <NumberValueCell value={effectifs.apprentis} />
                  <NumberValueCell value={effectifs.inscritsSansContrat} />
                  {!isPeriodInvalid && (
                    <>
                      <NumberValueCell value={effectifs.rupturants} />
                      <NumberValueCell value={effectifs.abandons} />
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
