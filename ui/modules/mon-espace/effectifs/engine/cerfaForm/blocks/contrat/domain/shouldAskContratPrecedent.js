export const shouldAskNumeroContratPrecedent = ({ values }) => {
  const typeContratApp = values.contrat.typeContratApp;
  return [21, 22, 23, 31, 32, 33, 34, 35, 36, 37].includes(typeContratApp);
};
