import Joi from "joi";

/*
    (?:(?:\+|00)33|0) handles the dialing : +33, 0033 and 0 are valid values
    \s*[1-9] handles the first number after dialing, it accepts a whitespace before it
    (?:[\s.-]*\d{2}){4} handles the rest, it accepts whitespace, dot (.), - or no separator between 4 sets of 2-digits numbers
*/
const FRENCH_TELEPHONE_NUMBER_REGEX = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;

const schema = Joi.string().pattern(FRENCH_TELEPHONE_NUMBER_REGEX);

export const validateFrenchTelephoneNumber = (value) => {
  return schema.validate(value);
};

// TODO a remove et remplacer par telephoneConverter partout ?
export const transformToInternationalNumber = (value) => (value ? `33${value.replace(/^0/, "")}` : value);

export const telephoneConverter = (telephone, tryStartByZero = false) => {
  if (!telephone) return telephone;
  let phone = telephone.replaceAll("-", "").replaceAll(".", "").replaceAll(" ", "");

  if (phone.length === 10 && phone[0] === "0") {
    return `+33${phone.substr(1, 9)}`;
  }

  // Gestion des téléphones au format 033xxxxxxxxx
  if (phone.length === 12 && phone[0] === "0") {
    return `+33${phone.substr(3, 12)}`;
  }

  if (!tryStartByZero) phone = telephoneConverter(`0${phone}`, true);
  return phone;
};
