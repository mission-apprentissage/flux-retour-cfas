import { Box, Link, Td, Tr } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { useFiltersContext } from "../../../../pages/app/visualiser-les-indicateurs/FiltersContext";
import { getPercentage } from "../../../utils/calculUtils";
import ProgressCell from "../ProgressCell";

const EffectifBySiretRow = ({ siret_etablissement, nom_etablissement, effectifs, isPeriodInvalid }) => {
  const filtersContext = useFiltersContext();
  const total = effectifs.apprentis + effectifs.inscritsSansContrat + effectifs.rupturants + effectifs.abandons;
  return (
    <Tr>
      <Td color="grey.800">
        <Link
          onClick={() => {
            filtersContext.setters.setSousEtablissement({ nom_etablissement, siret_etablissement });
            window.scrollTo(0, 0);
          }}
          color="bluefrance"
          whiteSpace="nowrap"
        >
          {nom_etablissement}
        </Link>
        <Box fontSize="omega">SIRET : {siret_etablissement}</Box>
      </Td>
      <ProgressCell label={effectifs.apprentis} value={getPercentage(effectifs.apprentis, total)} />
      <ProgressCell label={effectifs.inscritsSansContrat} value={getPercentage(effectifs.inscritsSansContrat, total)} />
      {!isPeriodInvalid && (
        <>
          <ProgressCell label={effectifs.rupturants} value={getPercentage(effectifs.rupturants, total)} />
          <ProgressCell label={effectifs.abandons} value={getPercentage(effectifs.abandons, total)} />
        </>
      )}
    </Tr>
  );
};

EffectifBySiretRow.propTypes = {
  siret_etablissement: PropTypes.string.isRequired,
  nom_etablissement: PropTypes.string.isRequired,
  isPeriodInvalid: PropTypes.bool,
  effectifs: PropTypes.shape({
    apprentis: PropTypes.number.isRequired,
    rupturants: PropTypes.number.isRequired,
    inscritsSansContrat: PropTypes.number.isRequired,
    abandons: PropTypes.number.isRequired,
  }).isRequired,
};

export default EffectifBySiretRow;
