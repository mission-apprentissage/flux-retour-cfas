import { find } from "lodash-es";
import { DEPARTEMENTS } from "shared";

import { isValidUAI } from "./validationUtils";

const SPECIFIC_UAI_CODES_CORSE1 = { code: "2A", uaiCode: "620" };
const SPECIFIC_UAI_CODES_CORSE2 = { code: "2B", uaiCode: "720" };

const getLocalisationInfoFromUai = (uai) => {
  const infoCodeFromUai = getDepartementCodeFromUai(uai);

  // TODO [tech] : gérer proprement les cas de la corse
  if (infoCodeFromUai === SPECIFIC_UAI_CODES_CORSE1.uaiCode)
    return find(DEPARTEMENTS, (departement) => departement.code === SPECIFIC_UAI_CODES_CORSE1.code);
  if (infoCodeFromUai === SPECIFIC_UAI_CODES_CORSE2.uaiCode)
    return find(DEPARTEMENTS, (departement) => departement.code === SPECIFIC_UAI_CODES_CORSE2.code);

  return find(DEPARTEMENTS, (departement) => departement.code === infoCodeFromUai);
};

export const buildAdresseFromUai = (uai) => {
  const localisationInfo = getLocalisationInfoFromUai(uai);
  if (!localisationInfo) return {};
  return {
    adresse: {
      departement: localisationInfo.code,
      region: localisationInfo.region.code,
      academie: localisationInfo.academie.code.toString(),
    },
  };
};

export const getDepartementCodeFromUai = (uai) => {
  if (!isValidUAI(uai)) throw new Error("invalid uai passed");
  const code = uai.slice(0, 3);
  return Number(code) < 10 ? `0${Number(code)}` : Number(code).toString();
};

const ALPHABET_23_LETTERS = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "j",
  "k",
  "l",
  "m",
  "n",
  "p",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
];

function computeChecksumUAI(numbers) {
  if (!numbers || numbers.length !== 7) {
    throw new Error("Le code ne doit contenir que 7 caractères sans le checksum");
  }

  return ALPHABET_23_LETTERS[numbers % 23];
}

export function algoUAI(code) {
  if (!code || code.length !== 8) {
    return false;
  }

  let numbers = code.substring(0, 7);
  let checksum = code.substring(7, 8).toLowerCase();

  return checksum === computeChecksumUAI(numbers);
}
