import PropTypes from "prop-types";
import React, { useState } from "react";

import { OverlayMenu, SecondarySelectButton } from "../../../../../common/components";
import MenuTabs from "../../../../../common/components/OverlayMenu/MenuTabs";
import { filtersPropTypes } from "../../../FiltersContext";
import CfaPanel from "./CfasPanel";
import ReseauxPanel from "./ReseauxPanel";

const CfasFilter = ({ onCfaChange, onReseauChange, filters, displayReseauPanel = true }) => {
  const [isOpen, setIsOpen] = useState(false);

  const buttonLabelForUser = displayReseauPanel
    ? "Sélectionner un organisme ou un réseau"
    : "Sélectionner un organisme";

  const onCfaClick = (cfa) => {
    onCfaChange(cfa);
    setIsOpen(false);
  };

  const onReseauClick = (reseau) => {
    onReseauChange(reseau);
    setIsOpen(false);
  };

  const buttonLabel = filters.cfa?.nom_etablissement || filters.reseau?.nom || buttonLabelForUser;

  return (
    <div>
      <SecondarySelectButton
        icon="ri-community-fill"
        onClick={() => setIsOpen(!isOpen)}
        isActive={isOpen}
        isClearable={Boolean(filters.cfa || filters.reseau)}
        clearIconOnClick={() => {
          onReseauChange(null);
          onCfaChange(null);
        }}
      >
        {buttonLabel}
      </SecondarySelectButton>

      {isOpen && (
        <OverlayMenu onClose={() => setIsOpen(false)}>
          <MenuTabs
            tabNames={displayReseauPanel ? ["Organismes de formation", "Réseaux"] : ["Organismes de formation"]}
          >
            <CfaPanel onCfaClick={onCfaClick} value={filters.cfa} filters={filters} />
            {displayReseauPanel === true && <ReseauxPanel onReseauClick={onReseauClick} value={filters.reseau} />}
          </MenuTabs>
        </OverlayMenu>
      )}
    </div>
  );
};

CfasFilter.propTypes = {
  onCfaChange: PropTypes.func.isRequired,
  onReseauChange: PropTypes.func.isRequired,
  filters: filtersPropTypes.state,
  displayReseauPanel: PropTypes.bool,
};

export default CfasFilter;
