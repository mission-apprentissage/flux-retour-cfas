import { Box, Td, Tr } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React, { useState } from "react";

import { useFiltersContext } from "../../../../pages/tableau-de-bord/FiltersContext";
import { getPercentage } from "../../../utils/calculUtils";
import { isDateFuture } from "../../../utils/dateUtils";
import ProgressCell from "../ProgressCell";
import CfasRows from "./CfasRows";

const DepartementRow = ({ departementCode, departementNom, effectifs }) => {
  const [isOpen, setIsOpen] = useState(false);
  const filtersContext = useFiltersContext();
  const shouldHideEffectifs = isDateFuture(filtersContext.state.date);
  const total = effectifs.apprentis + effectifs.inscritsSansContrat + effectifs.rupturants + effectifs.abandons;
  return (
    <>
      <Tr background="galt" onClick={() => setIsOpen(!isOpen)} cursor="pointer" _hover={{ background: "galt_hover" }}>
        <Td color="bluefrance">
          <Box as="i" className={isOpen ? "ri-subtract-line" : "ri-add-line"} verticalAlign="middle" fontSize="beta" />
          <Box as="span" fontWeight="700" verticalAlign="middle" marginLeft="1w">
            {departementNom} ({departementCode})
          </Box>
        </Td>
        <ProgressCell label={effectifs.apprentis} value={getPercentage(effectifs.apprentis, total)} />
        <ProgressCell
          label={effectifs.inscritsSansContrat}
          value={getPercentage(effectifs.inscritsSansContrat, total)}
        />
        {shouldHideEffectifs === false && (
          <>
            <ProgressCell label={effectifs.rupturants} value={getPercentage(effectifs.rupturants, total)} />
            <ProgressCell label={effectifs.abandons} value={getPercentage(effectifs.abandons, total)} />
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
  effectifs: PropTypes.shape({
    apprentis: PropTypes.number.isRequired,
    rupturants: PropTypes.number.isRequired,
    inscritsSansContrat: PropTypes.number.isRequired,
    abandons: PropTypes.number.isRequired,
  }).isRequired,
};

export default DepartementRow;
