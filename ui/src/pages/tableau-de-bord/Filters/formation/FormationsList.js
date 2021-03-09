import { List } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import TerritoireOption from "../territoire/TerritoireOption";

const FormationsList = ({ formations = [], onFormationClick, selectedValue }) => {
  return (
    <List spacing="1v" marginTop="1w" textAlign="left" maxHeight="20rem" overflowY="scroll">
      <TerritoireOption
        onClick={() => {
          onFormationClick(null);
        }}
        isSelected={!selectedValue}
      >
        Tous les centres de formation
      </TerritoireOption>
      {formations.map((formation) => (
        <TerritoireOption
          key={formation.cfd}
          onClick={() => onFormationClick(formation)}
          isSelected={formation.cfd === selectedValue?.cfd}
        >
          {formation.cfd} - {formation.libelle}
        </TerritoireOption>
      ))}
    </List>
  );
};

FormationsList.propTypes = {
  onFormationClick: PropTypes.func.isRequired,
  formations: PropTypes.arrayOf(
    PropTypes.shape({
      cfd: PropTypes.string.isRequired,
      libelle: PropTypes.string.isRequired,
    }).isRequired
  ),
  selectedValue: PropTypes.shape({
    cfd: PropTypes.string.isRequired,
    libelle: PropTypes.string.isRequired,
  }),
};

export default FormationsList;
