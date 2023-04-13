import { Box, Link, Td, Tr } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { useFiltersContext } from "@/modules/mon-espace/landing/visualiser-les-indicateurs/FiltersContext";
import NumberValueCell from "../NumberValueCell";

const EffectifBySiretRow = ({ siret_etablissement, nom_etablissement, effectifs, isPeriodInvalid }) => {
  const filtersContext = useFiltersContext();
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
