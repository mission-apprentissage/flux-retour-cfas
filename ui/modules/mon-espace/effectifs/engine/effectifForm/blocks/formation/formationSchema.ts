export const formationSchema = {
  "formation.cfd": {
    label: "Code Formation Diplôme (CFD)",
    mask: "C",
    maskBlocks: [
      {
        name: "C",
        mask: "Pattern",
        pattern: "^.+$",
      },
    ],
  },
  "formation.rncp": {
    required: true,
    showInfo: true,
    label: "Code RNCP de la formation",
    requiredMessage: "Le Code RNCP est obligatoire",
    mask: "C",
    maskBlocks: [
      {
        name: "C",
        mask: "Pattern",
        pattern: "^.+$",
      },
    ],
  },

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
  "formation.duree_theorique_mois": {
    fieldType: "numberStepper",
    required: true,
    label: "Durée théorique en mois :",
    requiredMessage: "Le nombre de mois théorique est obligatoire",
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
    max: 48,
    precision: 0,
  },
  "formation.annee": {
    fieldType: "numberStepper",
    required: true,
    label: "Année de la formation concernée",
    requiredMessage: "L'année de formation est obligatoire",
    validateMessage: " n'est pas valide (1,2,3,4,5)",
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
