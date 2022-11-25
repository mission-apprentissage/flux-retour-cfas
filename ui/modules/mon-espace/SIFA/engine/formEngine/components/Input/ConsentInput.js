import { Check } from "../../../../../theme/components/icons";
import { Checkbox, Text } from "@chakra-ui/react";
import React from "react";

export const ConsentInput = (props) => {
  const { name, onChange, value, locked, label, isRequired } = props;
  const handleChange = (e) => {
    onChange(e.target.checked || undefined);
  };

  return (
    <Checkbox
      name={name}
      onChange={handleChange}
      value="true"
      isChecked={value === true}
      isDisabled={locked}
      icon={<Check />}
    >
      {label}
      {isRequired && (
        <Text as="span" color="red.500" ml={1}>
          *
        </Text>
      )}
    </Checkbox>
  );
};
