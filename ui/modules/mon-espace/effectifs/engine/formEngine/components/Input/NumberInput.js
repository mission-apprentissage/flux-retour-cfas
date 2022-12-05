import {
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput as ChakraNumberInput,
  NumberInputField,
  NumberInputStepper,
} from "@chakra-ui/react";

import React, { useEffect, useState } from "react";
import { InputWrapper } from "./InputWrapper";

export const NumberInput = (props) => {
  const { name, onChange, error, example, description, locked, fieldType, minLength, maxLength, min, max } = props;

  const [localValue, setLocalValue] = useState(props.value);

  useEffect(() => {
    if (localValue && parseFloat(props.value) === parseFloat(localValue + "")) return;
    setLocalValue(props.value);
    // eslint-disable-next-line
  }, [setLocalValue, props.value]);

  return (
    <InputWrapper {...props}>
      <ChakraNumberInput
        precision={2}
        w="100%"
        variant="cerfa"
        isInvalid={!!error}
        name={name.replaceAll(".", "_")}
        type={fieldType}
        disabled={locked}
        onChange={(val) => {
          setLocalValue(val);
          if (!/\.$/.test(val) && val !== "") {
            onChange(parseFloat(val));
          }
        }}
        value={localValue}
        placeholder={example ? `Exemple : ${example}` : description}
        minLength={minLength}
        maxLength={maxLength}
        min={min}
        max={max}
      >
        <NumberInputField />
        {!locked && (
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        )}
      </ChakraNumberInput>
    </InputWrapper>
  );
};
