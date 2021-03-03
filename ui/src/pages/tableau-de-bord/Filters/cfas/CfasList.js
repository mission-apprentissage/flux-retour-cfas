import { List } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import TerritoireOption from "../territoire/TerritoireOption";

const CfasList = ({ cfas, onCfaClick, isSelected }) => {
  return (
    <List spacing="2w" textAlign="left" marginTop="2w" maxHeight="20rem" overflow="scroll">
      {cfas.map((cfa) => (
        <TerritoireOption
          key={cfa.siret_etablissement}
          onClick={() => {
            onCfaClick(cfa);
          }}
          isSelected={isSelected(cfa)}
        >
          {cfa.nom_etablissement}
        </TerritoireOption>
      ))}
    </List>
  );
};

CfasList.propTypes = {
  onCfaClick: PropTypes.func.isRequired,
  cfas: PropTypes.arrayOf(
    PropTypes.shape({
      siret_etablissement: PropTypes.string.isRequired,
      nom_etablissement: PropTypes.string.isRequired,
    }).isRequired
  ).isRequired,
  isSelected: PropTypes.func.isRequired,
};

export default CfasList;
