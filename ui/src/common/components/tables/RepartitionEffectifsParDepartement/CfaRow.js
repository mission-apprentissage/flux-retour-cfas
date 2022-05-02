import { Box, Link, Td, Tr } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { useFiltersContext } from "../../../../pages/app/visualiser-les-indicateurs/FiltersContext";
import { getPercentage } from "../../../utils/calculUtils";
import { isDateFuture } from "../../../utils/dateUtils";
import ProgressCell from "../ProgressCell";

const CfaRow = ({ uai_etablissement, nom_etablissement, effectifs, onCfaClick }) => {
  const total = effectifs.apprentis + effectifs.inscritsSansContrat + effectifs.rupturants + effectifs.abandons;
  const filtersContext = useFiltersContext();
  const isPeriodInvalid = isDateFuture(filtersContext.state.date);

  return (
    <Tr>
      <Td color="grey.800" paddingLeft="6w">
        <div>
          <Link onClick={onCfaClick} color="bluefrance" whiteSpace="nowrap">
            {nom_etablissement}
          </Link>
        </div>
        <Box fontSize="omega">UAI : {uai_etablissement}</Box>
      </Td>
      <ProgressCell label={effectifs.apprentis} value={getPercentage(effectifs.apprentis, total)} />
      <ProgressCell label={effectifs.inscritsSansContrat} value={getPercentage(effectifs.inscritsSansContrat, total)} />
      {!isPeriodInvalid && (
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
  onCfaClick: PropTypes.func.isRequired,
};

export default CfaRow;
