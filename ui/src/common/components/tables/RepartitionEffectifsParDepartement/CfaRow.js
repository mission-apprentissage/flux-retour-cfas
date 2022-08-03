import { Box, Link, Td, Tr } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { useFiltersContext } from "../../../../pages/app/visualiser-les-indicateurs/FiltersContext";
import { isDateFuture } from "../../../utils/dateUtils";
import NumberValueCell from "../NumberValueCell";

const CfaRow = ({ uai_etablissement, nom_etablissement, effectifs, onCfaClick }) => {
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
