export const formationSchema = {
  "formation.duree_formation_relle": {
    fieldType: "numberStepper",
    required: true,
    label: "Durée de la formation réelle en mois :",
    requiredMessage: "Le nombre d'heures de la formation est obligatoire",
    validateMessage: " n'est pas un nombre d'heures valide",
    mask: "C",
    maskBlocks: [
      {
        name: "C",
        mask: "Pattern",
        pattern: "^\\d*$",
      },
    ],
    min: 1,
    precision: 0,
  },
  "formation.date_debut_formation": {
    fieldType: "date",
    label: "Date de début de formation :",
    showInfo: true,
  },
  "formation.date_fin_formation": {
    fieldType: "date",
    label: "Date de fin de formation :",
    showInfo: true,
  },
  "formation.date_obtention_diplome": {
    fieldType: "date",
    label: "Date d'obtention du diplôme :",
    showInfo: true,
  },
};
