import { List } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React, { useState } from "react";

import { FilterOption, SearchInput } from "../../../../../common/components";
import { stringContains, stringEqualsCaseInsensitive } from "../../../../../common/utils/stringUtils";
import TouteLaFranceOption from "./TouteLaFranceOption";

const findTerritoire = (data) => (searchTerm) => {
  const regionMatches = data.regions.filter((region) => {
    return stringContains(region.nom, searchTerm) || stringEqualsCaseInsensitive(region.shortName, searchTerm);
  });
  const departementMatches = data.departements.filter((departement) => {
    return stringContains(departement.nom, searchTerm) || searchTerm === departement.code;
  });

  return [...regionMatches, ...departementMatches];
};

const TerritoireList = ({ data, onTerritoireClick, currentFilter }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTerritoires = searchTerm ? findTerritoire(data)(searchTerm) : data.regions;

  return (
    <>
      <SearchInput
        placeholder="Rechercher une région ou un département (exemple : Bretagne, Manche, PACA, 77...)"
        value={searchTerm}
        onChange={setSearchTerm}
      />
      <List spacing="1v" marginTop="1w" textAlign="left" maxHeight="18rem" overflowY="scroll">
        {!searchTerm && <TouteLaFranceOption onClick={() => onTerritoireClick()} />}
        {filteredTerritoires.map((territoire) => (
          <FilterOption
            key={territoire.code + territoire.nom}
            onClick={() => onTerritoireClick(territoire)}
            isSelected={currentFilter?.nom === territoire.nom}
          >
            {territoire.nom}
          </FilterOption>
        ))}
      </List>
    </>
  );
};

TerritoireList.propTypes = {
  data: PropTypes.shape({
    regions: PropTypes.shape({
      nom: PropTypes.string.isRequired,
      code: PropTypes.string.isRequired,
      shortName: PropTypes.string,
    }).isRequired,
    departements: PropTypes.shape({
      nom: PropTypes.string.isRequired,
      code: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
  onTerritoireClick: PropTypes.func.isRequired,
  currentFilter: PropTypes.shape({
    nom: PropTypes.string.isRequired,
    code: PropTypes.string.isRequired,
  }),
};

export default TerritoireList;
