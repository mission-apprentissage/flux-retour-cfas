import { List, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React, { useState } from "react";

import { FilterOption, SearchInput } from "../../../../../common/components";
import { stringContains, stringEqualsCaseInsensitive } from "../../../../../common/utils/stringUtils";
import { TERRITOIRE_TYPE } from "./constants";
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

const NoResults = () => {
  return (
    <Text color="grey.800" fontWeight="700" paddingTop="1w" paddingLeft="1w">
      Il n&apos;y a pas de département ou région correspondant à votre recherche
    </Text>
  );
};

const TerritoireList = ({ data, onTerritoireClick, currentFilter }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTerritoires = searchTerm ? findTerritoire(data)(searchTerm) : [...data.regions, ...data.departements];

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
            {territoire.type === TERRITOIRE_TYPE.DEPARTEMENT
              ? `${territoire.nom} (${territoire.code})`
              : territoire.nom}
          </FilterOption>
        ))}
      </List>
      {searchTerm && filteredTerritoires?.length === 0 && <NoResults />}
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
