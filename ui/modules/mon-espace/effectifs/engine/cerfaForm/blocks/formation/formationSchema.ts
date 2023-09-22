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
  "formation.duree_theorique": {
    fieldType: "numberStepper",
    required: true,
    label: "Durée théorique en années :",
    requiredMessage: "Le nombre d'années théorique est obligatoire",
    validateMessage: " n'est pas un nombre d'année valide",
    mask: "C",
    maskBlocks: [
      {
        name: "C",
        mask: "Pattern",
        pattern: "^\\d*$",
      },
    ],
    min: 1,
    max: 4,
    precision: 0,
  },
  "formation.annee": {
    fieldType: "number",
    label: "Année de la formation concernée",
  },
  "formation.date_inscription": {
    fieldType: "date",
    label: "Date d'inscription en formation :",
    showInfo: false,
  },
  "formation.date_entree": {
    fieldType: "date",
    label: "Date d'entrée en formation :",
    showInfo: false,
  },
  "formation.date_fin": {
    fieldType: "date",
    label: "Date de fin de formation :",
    showInfo: false,
  },
  "formation.date_obtention_diplome": {
    fieldType: "date",
    label: "Date d'obtention du diplôme :",
    showInfo: false,
  },
};
