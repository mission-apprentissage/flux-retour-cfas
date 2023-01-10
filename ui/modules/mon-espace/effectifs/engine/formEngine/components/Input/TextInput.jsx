import { Input as ChackraInput } from "@chakra-ui/react";

import React, { useMemo, useRef } from "react";
import { InputWrapper } from "./InputWrapper";
import { IMask, IMaskMixin } from "react-imask";

export const TextInput = (props) => {
  const {
    name,
    onChange,
    error,
    example,
    description,
    locked,
    fieldType,
    mask,
    maskBlocks,
    unmask,
    minLength,
    maxLength,
    min,
    max,
    precision,
  } = props;
  const value = props.value + "";

  const handleChange = (e) => {
    const val = e.target.value;
    if (fieldType === "number") {
      if (precision) {
        onChange(val === "" ? undefined : parseFloat(val));
      } else {
        onChange(val === "" ? undefined : parseInt(val));
      }
      return;
    }
    onChange(val);
  };

  return (
    <InputWrapper {...props}>
      {mask ? (
        <MaskedInput
          variant="cerfa"
          isInvalid={!!error}
          name={name.replaceAll(".", "_")}
          type={fieldType}
          disabled={locked}
          onChange={handleChange}
          value={value}
          placeholder={example ? `Exemple : ${example}` : description}
          mask={mask}
          maskBlocks={maskBlocks}
          unmask={unmask}
          minLength={minLength}
          maxLength={maxLength}
          min={min}
          max={max}
          precision={precision}
        />
      ) : (
        <ChackraInput
          variant="cerfa"
          isInvalid={!!error}
          name={name.replaceAll(".", "_")}
          type={fieldType}
          disabled={locked}
          step={1}
          onChange={handleChange}
          value={value}
          placeholder={example ? `Exemple : ${example}` : description}
          minLength={minLength}
          maxLength={maxLength}
          min={min}
          max={max}
        />
      )}
    </InputWrapper>
  );
};

const MaskedInput = (props) => {
  const {
    value,
    precision,
    min,
    onChange,
    mask,
    maskBlocks,
    unmask,
    placeholder,
    name,
    disabled,
    minLength,
    maxLength,
    variant,
  } = props;
  const inputRef = useRef(null);
  let blocks = useMemo(() => {
    return maskBlocks?.reduce((acc, item) => {
      if (item.mask === "MaskedRange")
        acc[item.name] = {
          mask: IMask.MaskedRange,
          ...(item.placeholderChar ? { placeholderChar: item.placeholderChar } : {}),
          from: item.from,
          to: item.to,
          maxLength: item.maxLength,
          autofix: item.autofix,
          lazy: item.lazy,
        };
      else if (item.mask === "MaskedEnum")
        acc[item.name] = {
          mask: IMask.MaskedEnum,
          ...(item.placeholderChar ? { placeholderChar: item.placeholderChar } : {}),
          enum: item.enum,
          maxLength: item.maxLength,
        };
      else if (item.mask === "Number")
        acc[item.name] = {
          mask: Number,
          radix: ".", // fractional delimiter
          mapToRadix: [".", ","], // symbols to process as radix
          normalizeZeros: item.normalizeZeros,
          scale: precision,
          signed: item.signed,
          min: min,
          max: item.max,
        };
      else if (item.mask === "Pattern")
        acc[item.name] = {
          mask: new RegExp(item.pattern),
        };
      else
        acc[item.name] = {
          mask: item.mask,
          ...(item.placeholderChar ? { placeholderChar: item.placeholderChar } : {}),
        };
      return acc;
    }, {});
  }, [maskBlocks, min, precision]);

  const valueRef = useMemo(() => ({ current: value }), [value]);
  const focusRef = useRef(false);

  const handle = (val) => {
    if (val !== value && focusRef.current === true) {
      onChange({ target: { value: val }, persist: () => {} });
    }
  };

  return (
    <MInput
      name={name.replaceAll(".", "_")}
      mask={mask}
      unmask={unmask ?? true}
      lazy={false}
      placeholderChar="_"
      autofix={true}
      blocks={blocks}
      disabled={disabled}
      onAccept={(currentValue) => (valueRef.current = currentValue)}
      onComplete={(va) => handle(va)}
      ref={inputRef}
      value={value + ""}
      onBlur={() => {
        handle(valueRef.current);
        focusRef.current = false;
      }}
      onFocus={() => (focusRef.current = true)}
      placeholder={placeholder}
      minLength={minLength}
      maxLength={maxLength}
      variant={variant}
    />
  );
};

const MInput = IMaskMixin(({ inputRef, ...props }) => <ChackraInput {...props} ref={inputRef} />);
