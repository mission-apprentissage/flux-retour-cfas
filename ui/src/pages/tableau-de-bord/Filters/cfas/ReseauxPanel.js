import { List } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import FilterOption from "../FilterOption";
import withReseauxData from "./withReseauxData";

const ReseauxPanel = ({ reseaux, onReseauClick, value }) => {
  return (
    <List spacing="1v" marginTop="1w" textAlign="left" maxHeight="18rem" overflowY="scroll">
      <FilterOption
        onClick={() => {
          onReseauClick(null);
        }}
        isSelected={!value}
      >
        Tous les réseaux
      </FilterOption>
      {reseaux &&
        reseaux.map((reseau) => (
          <FilterOption
            key={reseau.id}
            onClick={() => {
              onReseauClick(reseau);
            }}
            isSelected={value?.id === reseau.id}
          >
            {reseau.nom}
          </FilterOption>
        ))}
    </List>
  );
};

ReseauxPanel.propTypes = {
  onReseauClick: PropTypes.func.isRequired,
  reseaux: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      nom: PropTypes.string.isRequired,
    }).isRequired
  ),
  value: PropTypes.shape({
    id: PropTypes.string.isRequired,
    nom: PropTypes.string.isRequired,
  }),
};

export default withReseauxData(ReseauxPanel);
