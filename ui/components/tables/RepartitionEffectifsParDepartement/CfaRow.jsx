import { Box, Link, Td, Tr } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { useFiltersContext } from "@/modules/mon-espace/landing/visualiser-les-indicateurs/FiltersContext";
import { mapNatureOrganismeDeFormation } from "@/modules/mon-espace/landing/visualiser-les-indicateurs/par-organisme/sections/informations-cfa/CfaInformationSection";
import { isDateFuture } from "@/common/utils/dateUtils";
import NatureOrganismeDeFormationWarning from "../../NatureOrganismeDeFormationWarning/NatureOrganismeDeFormationWarning";
import NumberValueCell from "../NumberValueCell";

const CfaRow = ({
  uai_etablissement,
  siret_etablissement,
  nom_etablissement,
  nature,
  nature_validity_warning,
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
          UAI : {uai_etablissement || "N/A"} - SIRET : {siret_etablissement || "N/A"}
        </Box>
      </Td>
      <Td color="grey.800" whiteSpace="nowrap">
        {mapNatureOrganismeDeFormation(nature)}{" "}
        {nature_validity_warning && (
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
  siret_etablissement: PropTypes.string,
  nature: PropTypes.string,
  nature_validity_warning: PropTypes.bool,
  effectifs: PropTypes.shape({
    apprentis: PropTypes.number.isRequired,
    inscritsSansContrat: PropTypes.number.isRequired,
    rupturants: PropTypes.number.isRequired,
    abandons: PropTypes.number.isRequired,
  }).isRequired,
  onCfaClick: PropTypes.func.isRequired,
  uaiOrSiretContraint(props, _, componentName) {
    if (!props.uai_etablissement && !props.siret_etablissement) {
      return new Error(
        `One of 'uai_etablissement' or 'siret_etablissement' is required by '${componentName}' component.`
      );
    }
  },
};

export default CfaRow;
