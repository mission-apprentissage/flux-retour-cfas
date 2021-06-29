import PropTypes from "prop-types";
import React, { useState } from "react";

import { FilterButton, OverlayMenu } from "../../../../common/components";
import MenuTabs from "../../../../common/components/OverlayMenu/MenuTabs";
import { filtersPropTypes } from "../../FiltersContext";
import CfaPanel from "./CfasPanel";
import ReseauxPanel from "./ReseauxPanel";

const CfasFilter = ({ onCfaChange, onReseauChange, filters }) => {
  const [isOpen, setIsOpen] = useState(false);

  const onCfaClick = (cfa) => {
    onCfaChange(cfa);
    setIsOpen(false);
  };

  const onReseauClick = (reseau) => {
    onReseauChange(reseau);
    setIsOpen(false);
  };

  const buttonLabel = filters.cfa?.nom_etablissement || filters.reseau?.nom || "Tous les organismes de formation";

  return (
    <div>
      <FilterButton
        icon="ri-community-fill"
        onClick={() => setIsOpen(!isOpen)}
        displayClearIcon={filters.cfa || filters.reseau}
        clearIconOnClick={() => {
          onReseauChange(null);
          onCfaChange(null);
        }}
      >
        {buttonLabel}
      </FilterButton>

      {isOpen && (
        <OverlayMenu onClose={() => setIsOpen(false)}>
          <MenuTabs tabNames={["Organismes de formation", "Réseaux"]}>
            <CfaPanel onCfaClick={onCfaClick} value={filters.cfa} filters={filters} />
            <ReseauxPanel onReseauClick={onReseauClick} value={filters.reseau} />
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
};

export default CfasFilter;
