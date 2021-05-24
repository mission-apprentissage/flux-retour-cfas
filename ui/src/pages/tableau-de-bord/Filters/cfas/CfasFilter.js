import PropTypes from "prop-types";
import React, { useState } from "react";

import { FilterButton, OverlayMenu } from "../../../../common/components";
import MenuTabs from "../../../../common/components/OverlayMenu/MenuTabs";
import { filtersPropType } from "../../propTypes";
import CfaPanel from "./CfasPanel";
import ReseauxPanel from "./ReseauxPanel";

const CfasFilter = ({ onChange, value, filters }) => {
  const [isOpen, setIsOpen] = useState(false);

  const onCfaClick = (cfa) => {
    onChange(cfa ? { ...cfa, type: "cfa" } : null);
    setIsOpen(false);
  };

  const onReseauClick = (reseau) => {
    onChange(reseau ? { ...reseau, type: "reseau" } : null);
    setIsOpen(false);
  };

  const buttonLabel = !value
    ? "Tous les organismes de formation"
    : value.type === "cfa"
    ? value.nom_etablissement
    : value.nom;

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
          <MenuTabs tabNames={["Organismes de formation", "Réseaux"]}>
            <CfaPanel onCfaClick={onCfaClick} value={value} filters={filters} />
            <ReseauxPanel onReseauClick={onReseauClick} value={value} />
          </MenuTabs>
        </OverlayMenu>
      )}
    </div>
  );
};

CfasFilter.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.oneOfType([
    PropTypes.shape({
      siret_etablissement: PropTypes.string.isRequired,
      nom_etablissement: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
    }),
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      nom: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
    }),
  ]),
  filters: filtersPropType,
};

export default CfasFilter;
