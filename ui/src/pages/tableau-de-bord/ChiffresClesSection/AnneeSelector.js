import { List } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React, { useState } from "react";

import { OverlayMenu } from "../../../common/components";
import PrimarySelectButton from "../../../common/components/SelectButton/PrimarySelectButton";
import FilterOption from "../Filters/FilterOption";

const AnneeSelector = ({ options, selectedAnnee, setSelectedAnnee }) => {
  const [isOpen, setIsOpen] = useState(false);

  const onAnneeClick = (annee) => {
    setSelectedAnnee(annee);
    setIsOpen(false);
  };

  return (
    <div>
      <PrimarySelectButton onClick={() => setIsOpen(!isOpen)} isOpen={isOpen}>
        {selectedAnnee.label}
      </PrimarySelectButton>
      {isOpen && (
        <OverlayMenu onClose={() => setIsOpen(false)}>
          <List>
            {options.map((annee) => {
              return (
                <FilterOption
                  key={annee.value}
                  isSelected={annee.label === selectedAnnee.label}
                  onClick={() => onAnneeClick(annee)}
                >
                  {annee.label}
                </FilterOption>
              );
            })}
          </List>
        </OverlayMenu>
      )}
    </div>
  );
};

const dateRangePropTypes = PropTypes.arrayOf(PropTypes.instanceOf(Date));

AnneeSelector.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: dateRangePropTypes,
    })
  ).isRequired,
  selectedAnnee: PropTypes.shape({
    label: PropTypes.string.isRequired,
    value: dateRangePropTypes,
  }).isRequired,
  setSelectedAnnee: PropTypes.func.isRequired,
};

export default AnneeSelector;
