import { List } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import TerritoireOption from "../territoire/TerritoireOption";

const CfasList = ({ cfas, onCfaClick, selectedValue }) => {
  return (
    <List spacing="1v" marginTop="1w" textAlign="left" maxHeight="18rem" overflowY="scroll">
      <TerritoireOption
        onClick={() => {
          onCfaClick(null);
        }}
        isSelected={!selectedValue}
      >
        Tous les centres de formation
      </TerritoireOption>
      {cfas &&
        cfas.map((cfa) => (
          <TerritoireOption
            key={cfa.siret_etablissement}
            onClick={() => {
              onCfaClick(cfa);
            }}
            isSelected={selectedValue?.siret_etablissement === cfa.siret_etablissement}
          >
            {cfa.nom_etablissement} ({cfa.etablissement_num_departement})
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
  ),
  selectedValue: PropTypes.shape({
    siret_etablissement: PropTypes.string.isRequired,
    nom_etablissement: PropTypes.string.isRequired,
  }),
};

export default CfasList;
