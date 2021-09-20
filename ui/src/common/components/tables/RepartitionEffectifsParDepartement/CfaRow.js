import { Box, Td, Tr } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { useFiltersContext } from "../../../../pages/tableau-de-bord/FiltersContext";
import { getPercentage } from "../../../utils/calculUtils";
import { isDateFuture } from "../../../utils/dateUtils";
import ProgressCell from "../ProgressCell";

const CfaRow = ({ uai_etablissement, nom_etablissement, effectifs }) => {
  const total = effectifs.apprentis + effectifs.inscritsSansContrat + effectifs.rupturants + effectifs.abandons;
  const filtersContext = useFiltersContext();
  const shouldHideEffectifs = isDateFuture(filtersContext.state.date);
  return (
    <Tr>
      <Td color="grey.800" paddingLeft="6w">
        <Box>{nom_etablissement}</Box>
        <Box fontSize="omega">UAI : {uai_etablissement}</Box>
      </Td>
      <ProgressCell label={effectifs.apprentis} value={getPercentage(effectifs.apprentis, total)} />
      <ProgressCell label={effectifs.inscritsSansContrat} value={getPercentage(effectifs.inscritsSansContrat, total)} />
      {shouldHideEffectifs === false && (
        <>
          <ProgressCell label={effectifs.rupturants} value={getPercentage(effectifs.rupturants, total)} />
          <ProgressCell label={effectifs.abandons} value={getPercentage(effectifs.abandons, total)} />
        </>
      )}
    </Tr>
  );
};

CfaRow.propTypes = {
  uai_etablissement: PropTypes.string,
  nom_etablissement: PropTypes.string.isRequired,
  effectifs: PropTypes.shape({
    apprentis: PropTypes.number.isRequired,
    inscritsSansContrat: PropTypes.number.isRequired,
    rupturants: PropTypes.number.isRequired,
    abandons: PropTypes.number.isRequired,
  }).isRequired,
};

export default CfaRow;
