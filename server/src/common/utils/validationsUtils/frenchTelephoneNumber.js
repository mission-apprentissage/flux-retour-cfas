import Joi from "joi";

/*
    (?:(?:\+|00)33|0) handles the dialing : +33, 0033 and 0 are valid values
    \s*[1-9] handles the first number after dialing, it accepts a whitespace before it
    (?:[\s.-]*\d{2}){4} handles the rest, it accepts whitespace, dot (.), - or no separator between 4 sets of 2-digits numbers
*/
const FRENCH_TELEPHONE_NUMBER_REGEX = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;

export const schema = Joi.string().pattern(FRENCH_TELEPHONE_NUMBER_REGEX);

export const validateFrenchTelephoneNumber = (value) => {
  return schema.validate(value);
};

export const transformToInternationalNumber = (value) => `33${value.replace(/^0/, "")}`;
