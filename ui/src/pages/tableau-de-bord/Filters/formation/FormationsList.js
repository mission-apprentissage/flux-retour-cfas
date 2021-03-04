import { List, ListItem } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

const FormationsList = ({ formations, onFormationClick }) => {
  return (
    <List spacing="1v" marginTop="1w" textAlign="left" maxHeight="20rem" overflowY="scroll">
      {formations.map((formation) => (
        <ListItem
          key={formation.cfd}
          cursor="pointer"
          fontSize="zeta"
          role="button"
          color="grey.800"
          _hover={{ textDecoration: "underline" }}
          onClick={() => onFormationClick(formation)}
          padding="1w"
        >
          {formation.cfd} - {formation.libelle}
        </ListItem>
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
  ).isRequired,
};

export default FormationsList;
