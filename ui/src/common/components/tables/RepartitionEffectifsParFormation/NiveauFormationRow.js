import { Box, Td, Tr } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React, { useState } from "react";

import { getPercentage } from "../../../utils/calculUtils";
import ProgressCell from "../ProgressCell";
import FormationRows from "./FormationRows";

const NiveauFormationRow = ({ niveauFormation, niveauFormationLibelle, effectifs, isPeriodInvalid }) => {
  const [isOpen, setIsOpen] = useState(false);
  const total = effectifs.apprentis + effectifs.inscritsSansContrat + effectifs.rupturants + effectifs.abandons;
  return (
    <>
      <Tr background="galt" onClick={() => setIsOpen(!isOpen)} cursor="pointer" _hover={{ background: "galt_hover" }}>
        <Td color="bluefrance">
          <Box as="i" className={isOpen ? "ri-subtract-line" : "ri-add-line"} verticalAlign="middle" fontSize="beta" />
          <Box as="span" fontWeight="700" verticalAlign="middle" marginLeft="1w">
            Niveau {niveauFormationLibelle}
          </Box>
        </Td>
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
      {isOpen && <FormationRows niveauFormation={niveauFormation} />}
    </>
  );
};

NiveauFormationRow.propTypes = {
  niveauFormation: PropTypes.string.isRequired,
  niveauFormationLibelle: PropTypes.string.isRequired,
  isPeriodInvalid: PropTypes.bool,
  effectifs: PropTypes.shape({
    apprentis: PropTypes.number.isRequired,
    rupturants: PropTypes.number.isRequired,
    inscritsSansContrat: PropTypes.number.isRequired,
    abandons: PropTypes.number.isRequired,
  }).isRequired,
};

export default NiveauFormationRow;
