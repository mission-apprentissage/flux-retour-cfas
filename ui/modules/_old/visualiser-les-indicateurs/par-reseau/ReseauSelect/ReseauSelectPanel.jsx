import { Heading, List } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { FilterOption } from "../../../../../common/components";
import useReseauxData from "./useReseauxData";

const ReseauSelectPanel = ({ onReseauClick, value }) => {
  const { data: reseaux } = useReseauxData();

  return (
    <div>
      <Heading as="h3" variant="h3" marginBottom="3w" marginTop="2w">
        Sélectionner un réseau
      </Heading>
      <List spacing="1v" marginTop="1w" textAlign="left" maxHeight="18rem" overflowY="scroll">
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
    </div>
  );
};

ReseauSelectPanel.propTypes = {
  onReseauClick: PropTypes.func.isRequired,
  value: PropTypes.shape({
    id: PropTypes.string.isRequired,
    nom: PropTypes.string.isRequired,
  }),
};

export default ReseauSelectPanel;
