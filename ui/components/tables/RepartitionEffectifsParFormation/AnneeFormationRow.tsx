import { Td, Tr } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { toPrettyYearLabel } from "@/common/utils/stringUtils";
import NumberValueCell from "@/components/tables/NumberValueCell";

const AnneeFormationRow = ({ anneeFormation, effectifs }) => {
  return (
    <Tr>
      <Td paddingLeft="10w" color="grey.800">
        {anneeFormation ? toPrettyYearLabel(anneeFormation) : "Année non renseignée"}
      </Td>
      <NumberValueCell value={effectifs.apprentis} />
      <NumberValueCell value={effectifs.inscritsSansContrat} />
      <NumberValueCell value={effectifs.rupturants} />
      <NumberValueCell value={effectifs.abandons} />
    </Tr>
  );
};

AnneeFormationRow.propTypes = {
  anneeFormation: PropTypes.number.isRequired,
  effectifs: PropTypes.shape({
    apprentis: PropTypes.number.isRequired,
    inscritsSansContrat: PropTypes.number.isRequired,
    rupturants: PropTypes.number.isRequired,
    abandons: PropTypes.number.isRequired,
  }).isRequired,
};

export default AnneeFormationRow;
