import PropTypes from "prop-types";
import React, { useState } from "react";

import OverlayMenu from "@/components/OverlayMenu/OverlayMenu";
import PrimarySelectButton from "@/components/SelectButton/PrimarySelectButton";
import { filtersPropTypes } from "@/modules/mon-espace/landing/visualiser-les-indicateurs/FiltersContext";

import CfaPanel from "./CfasPanel";

const CfasFilter = ({ onCfaChange, filters, defaultButtonLabel = "Sélectionner un organisme" }) => {
  const [isOpen, setIsOpen] = useState(false);

  const onCfaClick = (cfa) => {
    onCfaChange(cfa);
    setIsOpen(false);
  };

  const buttonLabel = filters.cfa?.nom_etablissement || defaultButtonLabel;

  return (
    <div>
      <PrimarySelectButton onClick={() => setIsOpen(!isOpen)} isActive={isOpen}>
        {buttonLabel}
      </PrimarySelectButton>

      {isOpen && (
        <OverlayMenu onClose={() => setIsOpen(false)}>
          <CfaPanel onCfaClick={onCfaClick} value={filters.cfa} filters={filters} />
        </OverlayMenu>
      )}
    </div>
  );
};

CfasFilter.propTypes = {
  onCfaChange: PropTypes.func.isRequired,
  filters: filtersPropTypes.state,
  defaultButtonLabel: PropTypes.string,
};

export default CfasFilter;
