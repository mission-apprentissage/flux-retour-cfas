export const lieuDeFormationSchema = {
  "lieu_de_formation.adresse": {
    required: false,
    label: "Adresse du lieu de formation",
    fieldType: "text",
    mask: "C",
    maskBlocks: [
      {
        name: "C",
        mask: "Pattern",
        pattern: "^.+$",
      },
    ],
  },
  "lieu_de_formation.code_postal": {
    required: false,
    label: "Code postal du lieu de formation",
    fieldType: "text",
    pattern: "^[0-9]{5}$",
    mask: "C",
    maskBlocks: [
      {
        name: "C",
        mask: "Pattern",
        pattern: "^\\d*$",
      },
    ],
  },
};
