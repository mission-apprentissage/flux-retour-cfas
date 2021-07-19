import { List } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import FilterOption from "../FilterOption";

const SiretsList = ({ sirets, onSiretClick, value }) => {
  return (
    <List spacing="1v" marginTop="1w" textAlign="left" maxHeight="18rem" overflowY="scroll">
      {sirets &&
        sirets.map((siret) => (
          <FilterOption
            key={siret}
            onClick={() => {
              onSiretClick(siret);
            }}
            isSelected={value === siret}
          >
            {siret}
          </FilterOption>
        ))}
    </List>
  );
};

SiretsList.propTypes = {
  onSiretClick: PropTypes.func.isRequired,
  sirets: PropTypes.arrayOf(PropTypes.string).isRequired,
  value: PropTypes.string,
};

export default SiretsList;
