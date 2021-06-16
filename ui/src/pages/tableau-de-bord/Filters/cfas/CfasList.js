import { List } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import FilterOption from "../FilterOption";

const CfasList = ({ cfas, onCfaClick, selectedValue }) => {
  return (
    <List spacing="1v" marginTop="1w" textAlign="left" maxHeight="18rem" overflowY="scroll">
      <FilterOption
        onClick={() => {
          onCfaClick(null);
        }}
        isSelected={!selectedValue}
      >
        Tous les organismes de formation
      </FilterOption>
      {cfas &&
        cfas.map((cfa) => (
          <FilterOption
            key={cfa.uai_etablissement}
            onClick={() => {
              onCfaClick(cfa);
            }}
            isSelected={selectedValue?.uai_etablissement === cfa.uai_etablissement}
          >
            {cfa.nom_etablissement} ({cfa.etablissement_num_departement})
          </FilterOption>
        ))}
    </List>
  );
};

CfasList.propTypes = {
  onCfaClick: PropTypes.func.isRequired,
  cfas: PropTypes.arrayOf(
    PropTypes.shape({
      uai_etablissement: PropTypes.string.isRequired,
      nom_etablissement: PropTypes.string.isRequired,
    }).isRequired
  ),
  selectedValue: PropTypes.shape({
    uai_etablissement: PropTypes.string.isRequired,
    nom_etablissement: PropTypes.string.isRequired,
  }),
};

export default CfasList;
