import { List } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import FilterOption from "../FilterOption";

const FormationsList = ({ formations = [], onFormationClick, selectedValue }) => {
  return (
    <List spacing="1v" marginTop="1w" textAlign="left" maxHeight="20rem" overflowY="scroll">
      <FilterOption
        onClick={() => {
          onFormationClick(null);
        }}
        isSelected={!selectedValue}
      >
        Tous les centres de formation
      </FilterOption>
      {formations.map((formation) => (
        <FilterOption
          key={formation.cfd}
          onClick={() => onFormationClick(formation)}
          isSelected={formation.cfd === selectedValue?.cfd}
        >
          {formation.cfd} - {formation.libelle}
        </FilterOption>
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
