import { Input, InputGroup, InputLeftElement } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

const SearchInput = ({ value = "", placeholder = "", onChange }) => {
  return (
    <InputGroup>
      <InputLeftElement pointerEvents="none" fontSize="gamma" className="ri-search-line" as="i" marginTop="3px" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        size="lg"
        autoFocus
        color="grey.800"
        backgroundColor="grey.200"
        border="none"
        borderBottom="solid 2px"
        borderBottomColor="bluefrance"
        borderRadius="4px 0 0 0"
        fontSize="epsilon"
        _focus={{
          borderColor: "bluefrance",
          boxShadow: "none",
        }}
        _placeholder={{ fontSize: "epsilon" }}
      />
    </InputGroup>
  );
};

SearchInput.propTypes = {
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  value: PropTypes.string,
};

export default SearchInput;
