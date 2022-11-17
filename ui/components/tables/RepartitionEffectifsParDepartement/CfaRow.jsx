import { Box, Link, Td, Tr } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { isDateFuture } from "../../../common/utils/dateUtils";
import { useFiltersContext } from "../../../pages/app/visualiser-les-indicateurs/FiltersContext";
import { mapNatureOrganismeDeFormation } from "../../../pages/app/visualiser-les-indicateurs/par-organisme/sections/informations-cfa/CfaInformationSection";
import NatureOrganismeDeFormationWarning from "../../NatureOrganismeDeFormationWarning/NatureOrganismeDeFormationWarning";
import NumberValueCell from "../NumberValueCell";

const getSiretText = (sirets) => {
  if (!sirets || sirets.length === 0) return "N/A";
  if (sirets.length === 1) return sirets[0];
  return `${sirets.length} SIRET transmis`;
};

const CfaRow = ({
  uai_etablissement,
  siret_etablissement,
  nom_etablissement,
  nature,
  natureValidityWarning,
  effectifs,
  onCfaClick,
}) => {
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
        <Box fontSize="omega">
          UAI : {uai_etablissement} - SIRET : {getSiretText(siret_etablissement)}
        </Box>
      </Td>
      <Td color="grey.800" whiteSpace="nowrap">
        {mapNatureOrganismeDeFormation(nature)}{" "}
        {natureValidityWarning && (
          <span style={{ verticalAlign: "middle" }}>
            <NatureOrganismeDeFormationWarning />
          </span>
        )}
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
  siret_etablissement: PropTypes.arrayOf(PropTypes.string).isRequired,
  nature: PropTypes.string.isRequired,
  natureValidityWarning: PropTypes.bool.isRequired,
  effectifs: PropTypes.shape({
    apprentis: PropTypes.number.isRequired,
    inscritsSansContrat: PropTypes.number.isRequired,
    rupturants: PropTypes.number.isRequired,
    abandons: PropTypes.number.isRequired,
  }).isRequired,
  onCfaClick: PropTypes.func.isRequired,
};

export default CfaRow;
