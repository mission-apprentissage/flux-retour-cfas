import { shouldAskRepresentantLegal } from "./shouldAskRepresentantLegal";

export const shouldAskResponsalLegalAdresse = ({ values }) =>
  shouldAskRepresentantLegal({ values }) && values.apprenant.representant_legal?.meme_adresse === false;
