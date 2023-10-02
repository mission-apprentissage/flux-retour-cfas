import { Select as ChakraSelect } from "@chakra-ui/react";
import React, { useMemo } from "react";

import { InputWrapper } from "./InputWrapper";

export const Select = (props) => {
  const { name, locked, onChange, value, options, placeholder } = props;

  const handleChange = (e) => {
    const selectedLabel = e.target.value ?? undefined;
    const selectedValue = labelValueMap[selectedLabel];
    onChange(selectedValue);
  };

  const { labelValueMap, valueLabelMap } = useMemo(() => {
    const flatOptions = options[0].options ? options.flatMap((group) => group.options) : options;
    return {
      labelValueMap: Object.fromEntries(flatOptions.map((option) => [option.label, option.value])),
      valueLabelMap: Object.fromEntries(flatOptions.map((option) => [option.value, option.label])),
    };
  }, [options]);

  const selectedLabel = valueLabelMap[value];

  return (
    <InputWrapper {...props}>
      <ChakraSelect
        name={name}
        disabled={locked}
        // variant={validated ? "valid" : "outline"}
        onClick={(e) => e.stopPropagation()}
        onChange={handleChange}
        iconColor="gray.800"
        data-testid={`select-${name}`}
        placeholder={placeholder ?? "Sélectionner une option"}
        value={selectedLabel ?? ""}
        variant="effectifForm"
      >
        {options[0].options ? (
          <>
            {options.map((group, k) => {
              return (
                <optgroup label={group.name} key={k}>
                  {group.options.map((option, j) => {
                    return (
                      <option key={j} value={option.label} disabled={option.locked}>
                        {option.label}
                      </option>
                    );
                  })}
                </optgroup>
              );
            })}
          </>
        ) : (
          <>
            {options.map((option, j) => {
              return (
                <option key={j} value={option.label} disabled={option.locked}>
                  {option.label}
                </option>
              );
            })}
          </>
        )}
      </ChakraSelect>
    </InputWrapper>
  );
};
