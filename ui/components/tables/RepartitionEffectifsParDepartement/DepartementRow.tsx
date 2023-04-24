import { Box, Td, Tr } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React, { useState } from "react";

import NumberValueCell from "@/components/tables/NumberValueCell";

import CfasRows from "./CfasRows";

const DepartementRow = ({ departementCode, departementNom, effectifs, isPeriodInvalid }) => {
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
            {departementNom} ({departementCode})
          </Box>
        </Td>
        {/* Add empty cell to fill "Nature" (responsable, formateur...) column which does not make sense for a departement */}
        <Td />
        <NumberValueCell value={effectifs.apprentis} />
        <NumberValueCell value={effectifs.inscritsSansContrat} />
        {!isPeriodInvalid && (
          <>
            <NumberValueCell value={effectifs.rupturants} />
            <NumberValueCell value={effectifs.abandons} />
          </>
        )}
      </Tr>
      {isOpen && <CfasRows departementCode={departementCode} />}
    </>
  );
};

DepartementRow.propTypes = {
  departementCode: PropTypes.string.isRequired,
  departementNom: PropTypes.string.isRequired,
  isPeriodInvalid: PropTypes.bool,
  effectifs: PropTypes.shape({
    apprentis: PropTypes.number.isRequired,
    rupturants: PropTypes.number.isRequired,
    inscritsSansContrat: PropTypes.number.isRequired,
    abandons: PropTypes.number.isRequired,
  }).isRequired,
};

export default DepartementRow;
