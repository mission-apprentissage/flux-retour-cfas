import React, { useMemo } from "react";
import { HStack, Radio, RadioGroup } from "@chakra-ui/react";

export const RadioInput = (props) => {
  const { name, onChange, value, locked, options = [] } = props;

  const handleChange = (e) => {
    let newValue = e.target.value;
    newValue = labelValueMap[newValue];
    onChange(newValue);
  };

  const { labelValueMap, valueLabelMap } = useMemo(() => {
    return {
      labelValueMap: Object.fromEntries(options.map((option) => [option.label, option.value])),
      valueLabelMap: Object.fromEntries(options.map((option) => [option.value, option.label])),
    };
  }, [options]);

  return (
    <HStack>
      <RadioGroup value={valueLabelMap[value] ?? ""} name={name}>
        <HStack>
          {options.map((option, k) => {
            return (
              <Radio
                key={k}
                name={name}
                value={option.label}
                onChange={handleChange}
                isDisabled={option.locked || locked}
              >
                {option.label}
              </Radio>
            );
          })}
        </HStack>
      </RadioGroup>
    </HStack>
  );
};
