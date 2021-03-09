import PropTypes from "prop-types";
import React, { useState } from "react";

import { FilterButton, OverlayMenu } from "../../../../common/components";
import MenuTabs from "../../../../common/components/OverlayMenu/MenuTabs";
import CfaPanel from "./CfasPanel";
import ReseauxPanel from "./ReseauxPanel";

const CfasFilter = ({ onChange, value }) => {
  const [isOpen, setIsOpen] = useState(false);

  const onCfaClick = (cfa) => {
    onChange(cfa ? { ...cfa, type: "cfa" } : null);
    setIsOpen(false);
  };

  const buttonLabel = value ? value.nom_etablissement : "Tous les CFAs";

  return (
    <div>
      <FilterButton
        icon="ri-community-fill"
        onClick={() => setIsOpen(!isOpen)}
        displayClearIcon={!!value}
        clearIconOnClick={() => onChange(null)}
      >
        {buttonLabel}
      </FilterButton>

      {isOpen && (
        <OverlayMenu onClose={() => setIsOpen(false)}>
          <MenuTabs tabNames={["Centres de formation", "Réseaux"]}>
            <CfaPanel onCfaClick={onCfaClick} value={value} />
            <ReseauxPanel />
          </MenuTabs>
        </OverlayMenu>
      )}
    </div>
  );
};

CfasFilter.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.shape({
    siret_etablissement: PropTypes.string.isRequired,
    nom_etablissement: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
  }),
};

export default CfasFilter;
