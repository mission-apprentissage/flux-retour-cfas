import { InputWrapper } from "./InputWrapper";
import React from "react";
import PInput from "react-phone-input-2";

const getStatusClass = (props) => {
  if (props.locked) return "disabled";
  if (props.error) return "error";
  if (props.success) return "valid";
};

export const PhoneInput = (props) => {
  const { name, onChange, locked } = props;
  const value = props.value.replace("+", "");

  const handleChange = (val, country) => {
    onChange(`+${val}`, { countryCode: country.countryCode });
  };

  return (
    <InputWrapper {...props}>
      <PInput
        name={name}
        value={value}
        country={"fr"}
        masks={{
          fr: ". .. .. .. ..",
        }}
        countryCodeEditable={false}
        onChange={handleChange}
        disabled={locked}
        inputClass={`phone-form-input ${getStatusClass(props)}`}
        buttonClass={`phone-form-button ${getStatusClass(props)}`}
      />
    </InputWrapper>
  );
};
