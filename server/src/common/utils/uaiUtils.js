import departements from "../constants/departements.js";
import { uaiSchema } from "./validationUtils.js";

const SPECIFIC_UAI_CODES_CORSE1 = { code: "2A", uaiCode: "620" };
const SPECIFIC_UAI_CODES_CORSE2 = { code: "2B", uaiCode: "720" };

export const buildAdresseFromUai = (uai) => {
  const localisationInfo = getLocalisationInfoFromUai(uai);
  if (!localisationInfo) return {};
  return {
    adresse: {
      departement: localisationInfo.code_dept,
      region: localisationInfo.code_region,
      academie: localisationInfo.num_academie.toString(),
    },
  };
};

export const getLocalisationInfoFromUai = (uai) => {
  const infoCodeFromUai = getDepartementCodeFromUai(uai);

  // TODO : gérer proprement les cas de la corse
  if (infoCodeFromUai === SPECIFIC_UAI_CODES_CORSE1.uaiCode) return departements[SPECIFIC_UAI_CODES_CORSE1.code];
  if (infoCodeFromUai === SPECIFIC_UAI_CODES_CORSE2.uaiCode) return departements[SPECIFIC_UAI_CODES_CORSE2.code];

  return departements[infoCodeFromUai];
};

export const getDepartementCodeFromUai = (uai) => {
  if (uaiSchema.required().validate(uai).error) throw new Error("invalid uai passed");
  const code = uai.slice(0, 3);
  return Number(code) < 10 ? `0${Number(code)}` : Number(code).toString();
};
