import PropTypes from "prop-types";
import React, { useState } from "react";

import { filtersPropTypes } from "../../../pages/app/visualiser-les-indicateurs/FiltersContext";
import OverlayMenu from "../OverlayMenu/OverlayMenu";
import PrimarySelectButton from "../SelectButton/PrimarySelectButton";
import CfaPanel from "./CfasPanel";

const CfasFilter = ({ onCfaChange, filters }) => {
  const [isOpen, setIsOpen] = useState(false);

  const onCfaClick = (cfa) => {
    onCfaChange(cfa);
    setIsOpen(false);
  };

  const buttonLabel = filters.cfa?.nom_etablissement || "Sélectionner un organisme";

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
};

export default CfasFilter;
