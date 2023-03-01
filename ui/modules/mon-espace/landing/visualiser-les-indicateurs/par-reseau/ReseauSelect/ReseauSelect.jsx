import PropTypes from "prop-types";
import React, { useState } from "react";

import OverlayMenu from "@/components/OverlayMenu/OverlayMenu";
import PrimarySelectButton from "@/components/SelectButton/PrimarySelectButton";
import ReseauSelectPanel from "./ReseauSelectPanel";

const ReseauSelect = ({ onReseauChange, value }) => {
  const [isOpen, setIsOpen] = useState(false);

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

      {isOpen && (
        <OverlayMenu onClose={() => setIsOpen(false)}>
          <ReseauSelectPanel value={value} onReseauClick={onReseauClick} onClose={() => setIsOpen(false)} />
        </OverlayMenu>
      )}
    </div>
  );
};

ReseauSelect.propTypes = {
  onReseauChange: PropTypes.func.isRequired,
  value: PropTypes.shape({
    nom: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
  }),
};

export default ReseauSelect;
