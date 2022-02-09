import PropTypes from "prop-types";
import React, { useState } from "react";

import { OverlayMenu, SecondarySelectButton } from "../../../../../../../common/components";
import SousEtablissementList from "./SousEtablissementList";

const SousEtablissementFilter = ({ value, sousEtablissements, onSousEtablissementChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const onSousEtablissementClick = (sousEtablissement) => {
    onSousEtablissementChange(sousEtablissement);
    setIsOpen(false);
  };

  const buttonLabel = value
    ? `${value.nom_etablissement} - SIRET : ${value.siret_etablissement || "N/A"}`
    : "Tous les SIRETS";

  return (
    <>
      <SecondarySelectButton
        onClick={() => setIsOpen(!isOpen)}
        isClearable={Boolean(value)}
        clearIconOnClick={() => {
          onSousEtablissementChange(null);
        }}
      >
        {buttonLabel}
      </SecondarySelectButton>
      {isOpen && (
        <OverlayMenu onClose={() => setIsOpen(false)}>
          <SousEtablissementList
            sousEtablissements={sousEtablissements}
            onSousEtablissementClick={onSousEtablissementClick}
            value={value}
          ></SousEtablissementList>
        </OverlayMenu>
      )}
    </>
  );
};

SousEtablissementFilter.propTypes = {
  value: PropTypes.string,
  sousEtablissements: PropTypes.arrayOf(
    PropTypes.shape({
      siret_etablissement: PropTypes.string.isRequired,
      nom_etablissement: PropTypes.string,
    })
  ),
  onSousEtablissementChange: PropTypes.func.isRequired,
};

export default SousEtablissementFilter;
