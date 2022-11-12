import { Box, Td, Tr } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React, { useState } from "react";

import NumberValueCell from "../NumberValueCell";
import FormationRows from "./FormationRows";

const NiveauFormationRow = ({ niveauFormation, niveauFormationLibelle, effectifs, isPeriodInvalid }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Tr background="galt" onClick={() => setIsOpen(!isOpen)} cursor="pointer" _hover={{ background: "galt_hover" }}>
        <Td color="bluefrance">
          <Box
            as="i"
            className={isOpen ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"}
            verticalAlign="middle"
            fontSize="beta"
          />
          <Box as="span" fontWeight="700" verticalAlign="middle" marginLeft="1w">
            Niveau {niveauFormationLibelle}
          </Box>
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
