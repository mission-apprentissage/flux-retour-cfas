import React, { memo, useCallback, useMemo, useState } from "react";
import { validField } from "../../utils/validField";
import { Box, FormControl, FormErrorMessage, FormHelperText, FormLabel, HStack, InputGroup } from "@chakra-ui/react";
import InfoTooltip from "../../../../../components/InfoTooltip/InfoTooltip";
import { TextInput } from "./TextInput";
import { PhoneInput } from "./PhoneInput";
import { DateInput } from "./DateInput";
import { RadioInput } from "./RadioInput";
import { Select } from "./Select";
import { ConsentInput } from "./ConsentInput";
import { NumberInput } from "./NumberInput";

// eslint-disable-next-line react/display-name
export const Input = memo(
  ({
    loading,
    name,
    locked,
    options,
    description,
    warning,
    label,
    fieldType = "text",
    value,
    required,
    min,
    max,
    minLength,
    maxLength,
    pattern,
    mask,
    maskBlocks,
    onChange,
    onError,
    onSubmit,
    validate,
    error: externalError,
    mt,
    mb,
    w,
  }) => {
    const props = useMemo(
      () => ({
        name,
        options,
        locked,
        description,
        warning,
        label,
        fieldType,
        value,
        required,
        min,
        max,
        minLength,
        maxLength,
        pattern,
        mask,
        maskBlocks,
        validate,
        externalError,
      }),
      [
        description,
        options,
        fieldType,
        label,
        locked,
        mask,
        maskBlocks,
        max,
        maxLength,
        min,
        minLength,
        name,
        pattern,
        required,
        value,
        warning,
        validate,
        externalError,
      ]
    );
    const [fieldState, setFieldState] = useState({ value });

    const handle = useCallback(
      async (value, extra) => {
        const { error } = await validField({
          field: { ...props, extra },
          value,
        });
        setFieldState({ error, value });
        onChange?.(value, name, extra);
        if (error) {
          onError?.(value, name, extra);
          return;
        }
        onSubmit?.(value, name, extra);
      },
      [props, onChange, name, onSubmit, onError]
    );

    return (
      <InputField
        {...props}
        {...fieldState}
        isRequired={required}
        loading={loading}
        value={value ?? fieldState.value}
        error={fieldState.error || externalError}
        onChange={handle}
        mt={mt}
        mb={mb}
        w={w}
      />
    );
  }
);

// eslint-disable-next-line react/display-name
export const InputField = memo(({ mt, mb, ml, mr, w, ...props }) => {
  const { name, label, locked, isRequired, error, description, fieldType = "text", warning } = props;
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
      {!NoLabel[fieldType] && <FormLabel color={locked ? "disablegrey" : "labelgrey"}>{label}</FormLabel>}
      <HStack align="center">
        <InputGroup id={`${name}_group_input`}>
          <Component {...props} />
        </InputGroup>
        {description && (
          <Box>
            <InfoTooltip description={description} label={label} />
          </Box>
        )}
      </HStack>
      {warning && <FormHelperText color={"warning"}>{warning}</FormHelperText>}
      {error && <FormErrorMessage>{error}</FormErrorMessage>}
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
