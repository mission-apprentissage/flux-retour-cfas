import { List } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { FilterOption, OverlayMenu } from "../../../../../common/components";
import useReseauxData from "./useReseauxData";

const ReseauSelectOverlay = ({ onClose, onReseauClick, value }) => {
  const { data: reseaux } = useReseauxData();

  return (
    <OverlayMenu onClose={onClose}>
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
    </OverlayMenu>
  );
};

ReseauSelectOverlay.propTypes = {
  onReseauClick: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  value: PropTypes.shape({
    id: PropTypes.string.isRequired,
    nom: PropTypes.string.isRequired,
  }),
};

export default ReseauSelectOverlay;
