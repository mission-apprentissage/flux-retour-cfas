import PropTypes from "prop-types";
import React, { useState } from "react";

import { OverlayMenu, SecondarySelectButton } from "../../../../common/components";
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

  const buttonLabel = filters.cfa?.nom_etablissement || filters.reseau?.nom || "Sélectionner un organisme ou un réseau";

  return (
    <div>
      <SecondarySelectButton
        icon="ri-community-fill"
        onClick={() => setIsOpen(!isOpen)}
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
