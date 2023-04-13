export const shouldAskRepresentantLegal = ({ values }) => {
  return (
    values.apprenant.mineur_emancipe === false ||
    values.apprenant.representant_legal?.courriel ||
    values.apprenant.representant_legal?.telephone
  );
};
