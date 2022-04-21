import { Box, Td, Tr } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { getPercentage } from "../../../utils/calculUtils";
import ProgressCell from "../ProgressCell";

const EffectifBySiretRow = ({ siret_etablissement, nom_etablissement, effectifs, isPeriodInvalid }) => {
  const total = effectifs.apprentis + effectifs.inscritsSansContrat + effectifs.rupturants + effectifs.abandons;
  return (
    <Tr>
      <Td color="grey.800">
        <div>{nom_etablissement}</div>
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
