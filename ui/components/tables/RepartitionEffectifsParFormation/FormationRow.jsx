import { Box, Flex, Td, Tr } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React, { useState } from "react";

import { useFiltersContext } from "@/modules/mon-espace/landing/visualiser-les-indicateurs/FiltersContext";
import { isDateFuture } from "../../../utils/dateUtils";
import NumberValueCell from "../NumberValueCell";
import AnneeFormationRows from "./AnneeFormationRows";

const FormationRow = ({ formationCfd, intitule, effectifs }) => {
  const [isOpen, setIsOpen] = useState();
  const filtersContext = useFiltersContext();
  const isPeriodInvalid = isDateFuture(filtersContext.state.date);
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
              <div>{intitule}</div>
              <Box fontSize="omega">CFD : {formationCfd}</Box>
            </Box>
          </Flex>
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
