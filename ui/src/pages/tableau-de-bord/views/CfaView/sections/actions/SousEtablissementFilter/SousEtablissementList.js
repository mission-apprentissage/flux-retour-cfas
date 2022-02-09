import { List } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { FilterOption } from "../../../../../../../common/components";

const SousEtablissementsList = ({ sousEtablissements, onSousEtablissementClick, value }) => {
  return (
    <List spacing="1v" textAlign="left" maxHeight="18rem" overflowY="scroll">
      {sousEtablissements.map((sousEtablissement) => {
        const { siret_etablissement, nom_etablissement } = sousEtablissement;
        return (
          <FilterOption
            key={siret_etablissement}
            onClick={() => {
              onSousEtablissementClick(sousEtablissement);
            }}
            isSelected={value === siret_etablissement}
          >
            SIRET : {siret_etablissement || "N/A"} - {nom_etablissement}
          </FilterOption>
        );
      })}
    </List>
  );
};

SousEtablissementsList.propTypes = {
  onSousEtablissementClick: PropTypes.func.isRequired,
  sousEtablissements: PropTypes.arrayOf(
    PropTypes.shape({
      siret_etablisement: PropTypes.string.isRequired,
      nom_etablissement: PropTypes.string,
    })
  ).isRequired,
  value: PropTypes.PropTypes.shape({
    siret_etablisement: PropTypes.string.isRequired,
    nom_etablissement: PropTypes.string,
  }),
};

export default SousEtablissementsList;
