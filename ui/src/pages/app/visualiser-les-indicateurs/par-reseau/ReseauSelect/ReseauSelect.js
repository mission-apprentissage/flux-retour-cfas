import PropTypes from "prop-types";
import React, { useState } from "react";

import { PrimarySelectButton } from "../../../../../common/components";
import ReseauSelectOverlay from "./ReseauSelectOverlay";

const ReseauSelect = ({ defaultIsOpen = false, onReseauChange, value }) => {
  const [isOpen, setIsOpen] = useState(defaultIsOpen);

  const onReseauClick = (reseau) => {
    onReseauChange(reseau);
    setIsOpen(false);
  };

  const buttonLabel = value ? `Réseau ${value.nom}` : "Sélectionner un réseau";

  return (
    <div>
      <PrimarySelectButton onClick={() => setIsOpen(!isOpen)} isActive={isOpen} isClearable={false}>
        {buttonLabel}
      </PrimarySelectButton>

      {isOpen && <ReseauSelectOverlay value={value} onReseauClick={onReseauClick} onClose={() => setIsOpen(false)} />}
    </div>
  );
};

ReseauSelect.propTypes = {
  onReseauChange: PropTypes.func.isRequired,
  value: PropTypes.shape({
    nom: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
  }),
  defaultIsOpen: PropTypes.bool,
};

export default ReseauSelect;
