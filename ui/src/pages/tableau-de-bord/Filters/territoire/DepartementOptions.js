import { List, ListItem } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React, { useState } from "react";

import { SearchInput } from "../../../../common/components";
import TerritoireOption from "./TerritoireOption";

const MAX_DEPARTEMENTS_OPTIONS_DISPLAYED_LENGTH = 9;

const DepartementOptions = ({ departements = [], onDepartementClick, currentFilter }) => {
  const [departementSearchTerm, setDepartementSearchTerm] = useState("");

  const filteredDepartements = departementSearchTerm
    ? departements.filter((departement) => {
        return departement.nom.toLowerCase().indexOf(departementSearchTerm.toLowerCase()) > -1;
      })
    : departements;

  return (
    <>
      <SearchInput
        placeholder="Saisissez un département"
        value={departementSearchTerm}
        onChange={setDepartementSearchTerm}
      />
      <List spacing="1v" marginTop="1w" textAlign="left" maxHeight="18rem" overflowY="scroll">
        <TerritoireOption
          onClick={() => {
            onDepartementClick(null);
          }}
          isSelected={currentFilter === null}
        >
          Toute la France
        </TerritoireOption>
        {filteredDepartements.slice(0, MAX_DEPARTEMENTS_OPTIONS_DISPLAYED_LENGTH).map((filter) => (
          <TerritoireOption
            key={filter.code}
            onClick={() => onDepartementClick(filter)}
            isSelected={currentFilter?.nom === filter.nom}
          >
            {filter.nom}
          </TerritoireOption>
        ))}
        {filteredDepartements.length > MAX_DEPARTEMENTS_OPTIONS_DISPLAYED_LENGTH && <ListItem>...</ListItem>}
      </List>
    </>
  );
};

DepartementOptions.propTypes = {
  departements: PropTypes.arrayOf(
    PropTypes.shape({
      nom: PropTypes.string.isRequired,
      code: PropTypes.string.isRequired,
    }).isRequired
  ),
  onDepartementClick: PropTypes.func.isRequired,
  currentFilter: PropTypes.shape({
    nom: PropTypes.string.isRequired,
  }),
};

export default DepartementOptions;
