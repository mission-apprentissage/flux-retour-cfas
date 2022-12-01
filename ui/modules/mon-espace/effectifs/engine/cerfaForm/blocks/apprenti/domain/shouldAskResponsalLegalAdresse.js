import { shouldAskRepresentantLegal } from "./shouldAskRepresentantLegal";

export const shouldAskResponsalLegalAdresse = ({ values }) =>
  shouldAskRepresentantLegal({ values }) && values.apprenti.responsableLegal.memeAdresse === false;
