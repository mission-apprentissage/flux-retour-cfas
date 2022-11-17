export const getLabelNumeroContratPrecedent = ({ values }) =>
  [21, 22, 23].includes(values.contrat.typeContratApp)
    ? "Numéro du contrat précédent :"
    : "Numéro de contrat sur lequel porte l'avenant :";
