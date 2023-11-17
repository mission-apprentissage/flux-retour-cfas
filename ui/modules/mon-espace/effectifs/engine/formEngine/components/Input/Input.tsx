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
import React, { memo, useCallback, useMemo, useState } from "react";

import InfoTooltip from "@/components/InfoTooltip/InfoTooltip";
import { validField } from "@/modules/mon-espace/effectifs/engine/formEngine/utils/validField";

import { ConsentInput } from "./ConsentInput";
import { DateInput } from "./DateInput";
import { NumberInput } from "./NumberInput";
import { PhoneInput } from "./PhoneInput";
import { RadioInput } from "./RadioInput";
import { Select } from "./Select";
import { TextInput } from "./TextInput";

// eslint-disable-next-line react/display-name
export const Input = memo(
  ({
    loading,
    name,
    locked,
    options,
    description,
    placeholder,
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
    precision,
    error: externalError,
    mt,
    mb,
    w,
  }: any) => {
    const props = useMemo(
      () => ({
        name,
        options,
        locked,
        description,
        placeholder,
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
        precision,
      }),
      [
        description,
        placeholder,
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
        precision,
      ]
    );
    const [fieldState, setFieldState] = useState<{ value: any; error?: any }>({ value });

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
            <InfoTooltip description={description} label={label} />
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
