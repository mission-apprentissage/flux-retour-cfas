import { Box, Flex, Td, Tr } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React, { useState } from "react";

import { useFiltersContext } from "../../../../pages/tableau-de-bord/FiltersContext";
import { getPercentage } from "../../../utils/calculUtils";
import { isDateFuture } from "../../../utils/dateUtils";
import ProgressCell from "../ProgressCell";
import AnneeFormationRows from "./AnneeFormationRows";

const FormationRow = ({ formationCfd, intitule, effectifs }) => {
  const [isOpen, setIsOpen] = useState();
  const filtersContext = useFiltersContext();
  const isPeriodInvalid = isDateFuture(filtersContext.state.date);
  const total = effectifs.apprentis + effectifs.inscritsSansContrat + effectifs.rupturants + effectifs.abandons;
  return (
    <>
      <Tr color="grey.800" _hover={{ background: "grey.100" }} onClick={() => setIsOpen(!isOpen)} cursor="pointer">
        <Td paddingLeft="6w">
          <Flex>
            <Box
              as="i"
              className={isOpen ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"}
              verticalAlign="middle"
              color="bluefrance"
              fontSize="beta"
            />
            <Box verticalAlign="middle" marginLeft="1w">
              <Box>{intitule}</Box>
              <Box fontSize="omega">CFD : {formationCfd}</Box>
            </Box>
          </Flex>
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
      {isOpen && <AnneeFormationRows formationCfd={formationCfd} />}
    </>
  );
};

FormationRow.propTypes = {
  formationCfd: PropTypes.string.isRequired,
  intitule: PropTypes.string.isRequired,
  effectifs: PropTypes.shape({
    apprentis: PropTypes.number.isRequired,
    inscritsSansContrat: PropTypes.number.isRequired,
    rupturants: PropTypes.number.isRequired,
    abandons: PropTypes.number.isRequired,
  }).isRequired,
};

export default FormationRow;
