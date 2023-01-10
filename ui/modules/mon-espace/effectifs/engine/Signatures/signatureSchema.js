export const signatureSchema = {
  "contrat.lieuSignatureContrat": {
    label: "Fait à :",
    requiredMessage: "Le lieu de signature est obligatoire",
    fieldType: "text",
    required: true,
    autosave: false,
  },
  "contrat.dateConclusion": {
    label: "le",
    fieldType: "date",
    requiredMessage: "La date de conclusion de contrat est obligatoire",
    required: true,
    autosave: false,
  },
};
