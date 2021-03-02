import { Input, InputGroup, InputLeftElement } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

const SearchInput = ({ value = "", onChange }) => {
  return (
    <InputGroup>
      <InputLeftElement pointerEvents="none" className="ri-search-line" as="i" paddingBottom="1w" />
      <Input
        placeholder="Saisissez un libellé de formation ou un CFD"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        size="sm"
        autoFocus
      />
    </InputGroup>
  );
};

SearchInput.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string,
};

export default SearchInput;
