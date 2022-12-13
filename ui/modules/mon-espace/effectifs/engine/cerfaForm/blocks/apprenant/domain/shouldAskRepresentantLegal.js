export const shouldAskRepresentantLegal = ({ values }) => {
  return values.apprenant.mineur_emancipe === false;
};
