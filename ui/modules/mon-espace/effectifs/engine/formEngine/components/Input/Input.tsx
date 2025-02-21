import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  HStack,
  InputGroup,
} from "@chakra-ui/react";
import React, { memo } from "react";

import InputTooltip from "@/components/Tooltip/InputTooltip";

import { ConsentInput } from "./ConsentInput";
import { DateInput } from "./DateInput";
import { NumberInput } from "./NumberInput";
import { PhoneInput } from "./PhoneInput";
import { RadioInput } from "./RadioInput";
import { Select } from "./Select";
import { TextInput } from "./TextInput";

// eslint-disable-next-line react/display-name
export const InputField = memo(({ mt, mb, ml, mr, w, ...props }: any) => {
  const {
    name,
    label,
    locked,
    isRequired,
    error,
    description,
    fieldType = "text",
    warning,
    showApplyAllOption,
    onApplyAll,
  } = props;
  const Component = TypesMapping[fieldType] ?? (() => <></>);

  return (
    <FormControl
      isRequired={isRequired && !!label}
      isInvalid={!!error}
      mt={mt}
      mb={mb ?? 4}
      ml={ml}
      mr={mr}
      w={w}
      id={name.replaceAll(".", "_")}
    >
      {!NoLabel[fieldType] && label && <FormLabel color={locked ? "disablegrey" : "labelgrey"}>{label}</FormLabel>}
      <HStack align="center">
        <InputGroup id={`${name}_group_input`} isolation="auto">
          <Component {...props} />
        </InputGroup>
        {description && (
          <Box>
            <InputTooltip description={description} label={label} />
          </Box>
        )}
      </HStack>
      {warning && (
        <FormHelperText color={"warning"}>{typeof warning !== "function" ? warning : warning()}</FormHelperText>
      )}
      {error && <FormErrorMessage>{typeof error !== "function" ? error : error()}</FormErrorMessage>}
      {showApplyAllOption && onApplyAll && (
        <Button
          mt="2"
          mb="4"
          variant="secondary"
          fontSize="zeta"
          size="sm"
          onClick={() => {
            onApplyAll(props.value);
          }}
        >
          Appliquer ce paramètre à tous les effectifs
        </Button>
      )}
    </FormControl>
  );
});

const NoLabel = {
  consent: true,
};

const TypesMapping = {
  text: TextInput,
  number: TextInput,
  numberStepper: NumberInput,
  email: TextInput,
  phone: PhoneInput,
  date: DateInput,
  radio: RadioInput,
  select: Select,
  consent: ConsentInput,
};
