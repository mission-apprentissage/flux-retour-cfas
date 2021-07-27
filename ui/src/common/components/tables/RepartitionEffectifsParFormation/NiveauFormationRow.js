import { Box, Td, Tr } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React, { useState } from "react";

import { getPercentage } from "../../../utils/calculUtils";
import ProgressCell from "../ProgressCell";
import FormationRows from "./FormationRows";

const NiveauFormationRow = ({ niveauFormation, effectifs }) => {
  const [isOpen, setIsOpen] = useState(false);
  const total = effectifs.apprentis + effectifs.jeunesSansContrat + effectifs.rupturants + effectifs.abandons;
  return (
    <>
      <Tr background="galt">
        <Td color="bluefrance" onClick={() => setIsOpen(!isOpen)} cursor="pointer">
          <Box as="i" className={isOpen ? "ri-subtract-line" : "ri-add-line"} verticalAlign="middle" fontSize="beta" />
          <Box as="span" fontWeight="700" verticalAlign="middle" marginLeft="1w">
            Niveau {niveauFormation}
          </Box>
        </Td>
        <ProgressCell label={effectifs.apprentis} value={getPercentage(effectifs.apprentis, total)} />
        <ProgressCell label={effectifs.jeunesSansContrat} value={getPercentage(effectifs.jeunesSansContrat, total)} />
        <ProgressCell label={effectifs.rupturants} value={getPercentage(effectifs.rupturants, total)} />
        <ProgressCell label={effectifs.abandons} value={getPercentage(effectifs.abandons, total)} />
      </Tr>
      {isOpen && <FormationRows niveauFormation={niveauFormation} />}
    </>
  );
};

NiveauFormationRow.propTypes = {
  niveauFormation: PropTypes.string.isRequired,
  effectifs: PropTypes.shape({
    apprentis: PropTypes.number.isRequired,
    rupturants: PropTypes.number.isRequired,
    jeunesSansContrat: PropTypes.number.isRequired,
    abandons: PropTypes.number.isRequired,
  }).isRequired,
};

export default NiveauFormationRow;
