export const shouldAskRepresentantLegal = ({ values }) => {
  return values.apprenti.apprentiMineurNonEmancipe === true;
};
