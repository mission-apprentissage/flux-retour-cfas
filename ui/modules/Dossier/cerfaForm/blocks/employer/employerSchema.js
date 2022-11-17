import { INDICE_DE_REPETITION_OPTIONS } from "../../domain/indiceDeRepetionOptions";

export const employerSchema = {
  "employeur.adresse.codePostal": {
    required: true,
    label: "Code postal :",
    requiredMessage: "Le code postal est obligatoire",
    validateMessage: "n'est pas un code postal valide",
    mask: "C",
    maskBlocks: [
      {
        name: "C",
        mask: "Pattern",
        pattern: "^\\d*$",
      },
    ],
  },
  "employeur.siret": {
    required: true,
    showInfo: true,
    label: "N° SIRET de l'employeur :",
    requiredMessage: "Le siret est obligatoire",
    validateMessage: "n'est pas un siret valide",
    mask: "C",
    maskBlocks: [
      {
        name: "C",
        mask: "Pattern",
        pattern: "^\\d*$",
      },
    ],
  },
  "employeur.denomination": {
    required: true,
    label: "Dénomination :",
    showInfo: true,
    requiredMessage: "La dénomination de l'employeur est obligatoire",
    mask: "C",
    maskBlocks: [
      {
        name: "C",
        mask: "Pattern",
        pattern: "^.*$",
      },
    ],
  },
  "employeur.adresse.numero": {
    precision: 0,
    fieldType: "number",
    label: "N° :",
    validateMessage: "le numéro de voie ne peut pas commencer par zéro",
    mask: "C",
    maskBlocks: [
      {
        name: "C",
        mask: "Pattern",
        pattern: "^\\d*$",
      },
    ],
  },
  "employeur.adresse.repetitionVoie": {
    fieldType: "select",
    label: "Indice de répétition",
    validateMessage: `n'est pas un indice de répétition valide`,
    options: INDICE_DE_REPETITION_OPTIONS,
  },
  "employeur.adresse.voie": {
    required: true,
    label: "Voie :",
    requiredMessage: "le nom de voie est obligatoire",
    mask: "C",
    maskBlocks: [
      {
        name: "C",
        mask: "Pattern",
        pattern: "^.*$",
      },
    ],
  },
  "employeur.adresse.complement": {
    label: "Complément d'adresse (optionnel):",
    requiredMessage: "le complement d'adress est obligatoire",
  },
  "employeur.adresse.commune": {
    required: true,
    label: "Commune: ",
    requiredMessage: "la commune est obligatoire",
    mask: "C",
    maskBlocks: [
      {
        name: "C",
        mask: "Pattern",
        pattern: "^.*$",
      },
    ],
  },
  "employeur.adresse.departement": {
    required: true,
    label: "Département de l'employeur :",
    requiredMessage: "le département de l'employeur est obligatoire",
    validateMessage: " n'est pas un département valide",
  },
  "employeur.adresse.region": {
    required: true,
    fieldType: "select",
    label: "Région de l'employeur :",
    requiredMessage: "la région de l'employeur est obligatoire",
    validateMessage: " n'est pas une région valide",
    options: [
      {
        label: "1 - Guadeloupe",
        value: "1",
      },
      {
        label: "2 - Martinique",
        value: "2",
      },
      {
        label: "3 - Guyane",
        value: "3",
      },
      {
        label: "4 - La Réunion",
        value: "4",
      },
      {
        label: "6 - Mayotte",
        value: "6",
      },
      {
        label: "11 - Ile de France",
        value: "11",
      },
      {
        label: "24 - Centre- Val de Loire",
        value: "24",
      },
      {
        label: "27 - Bourgogne Franche Comté",
        value: "27",
      },
      {
        label: "28 - Normandie",
        value: "28",
      },
      {
        label: "32 - Hauts de France",
        value: "32",
      },
      {
        label: "44 - Grand Est",
        value: "44",
      },
      {
        label: "52 - Pays de la Loire",
        value: "52",
      },
      {
        label: "53 - Bretagne",
        value: "53",
      },
      {
        label: "75 - Nouvelle-Aquitaine",
        value: "75",
      },
      {
        label: "76 - Occitanie",
        value: "76",
      },
      {
        label: "84 - Auvergne-Rhône-Alpes",
        value: "84",
      },
      {
        label: "93 - Provence-Alpes-Côte d'Azur",
        value: "93",
      },
      {
        label: "94 - Corse",
        value: "94",
      },
      {
        label: "905 - St Pierre et Miquelon",
        value: "905",
      },
      {
        label: "912 - Nouvelle Calédonie",
        value: "912",
      },
    ],
    mask: "C",
    maskBlocks: [
      {
        name: "C",
        mask: "Pattern",
        pattern: "^\\d*$",
      },
    ],
  },
  "employeur.telephone": {
    fieldType: "phone",
    required: true,
    showInfo: true,
    label: "Téléphone de l'employeur :",
    requiredMessage: "Le téléphone de l'employeur est obligatoire",
  },
  "employeur.courriel": {
    required: true,
    fieldType: "email",
    showInfo: true,
    label: "Courriel de l'employeur :",
    requiredMessage: "Le courriel de l'employeur est obligatoire",
    mask: "C",
    maskBlocks: [
      {
        name: "C",
        mask: "Pattern",
        pattern: "^.*$",
      },
    ],
  },
  "employeur.naf": {
    required: true,
    showInfo: true,
    label: "Code NAF de l'employeur :",
    requiredMessage: "le code NAF est obligatoire",
    validateMessage: "le code NAF n'est pas au bon format",
    mask: "C",
    maskBlocks: [
      {
        name: "C",
        mask: "Pattern",
        pattern: "^([0-9]{1,2})\\.?([0-9A-Za-z]{0,3})$",
      },
    ],
  },
  "employeur.nombreDeSalaries": {
    fieldType: "number",
    required: true,
    showInfo: true,
    label: "Effectif salarié de l'entreprise :",
    requiredMessage: "Effectif salarié de l'entreprise est obligatoire",
    mask: "C",
    maskBlocks: [
      {
        name: "C",
        mask: "Pattern",
        pattern: "^\\d*$",
      },
    ],
    validate: ({ value }) => {
      if (value > 9999999) return { error: "Le nombre de salariés ne peut excéder 9999999" };
    },
  },
  "employeur.typeEmployeur": {
    required: true,
    label: "Type d'employeur :",
    requiredMessage: "le type d'employeur est obligatoire",
    showInfo: true,
    options: [
      {
        name: "Public",
        options: [
          {
            label:
              "21 Service de l'Etat (administrations centrales et leurs services déconcentrés de la fonction publique d'Etat)",
            value: 21,
          },
          {
            label: "22 Commune",
            value: 22,
          },
          {
            label: "23 Département",
            value: 23,
          },
          {
            label: "24 Région",
            value: 24,
          },
          {
            label: "25 Etablissement public hospitalier",
            value: 25,
          },
          {
            label: "26 Etablissement public local d'enseignement",
            value: 26,
          },
          {
            label: "27 Etablissement public administratif de l'Etat",
            value: 27,
          },
          {
            label:
              "28 Etablissement public administratif local (y compris établissement public de coopération intercommunale EPCI)",
            value: 28,
          },
          {
            label: "29 Autre employeur public",
            value: 29,
          },
        ],
      },
    ],
  },
  "employeur.employeurSpecifique": {
    label: "Est un employeur spécifique :",
    options: [
      {
        label: "1 Entreprise de travail temporaire",
        value: 1,
      },
      {
        label: "2 Groupement d'employeurs",
        value: 2,
      },
      {
        label: "3 Employeur saisonnier",
        value: 3,
      },
      {
        label: "4 Apprentissage familial : l'employeur est un ascendant de l'apprenti",
        value: 4,
      },
      {
        label: "0 Aucun de ces cas",
        value: 0,
      },
    ],
  },
  "employeur.codeIdcc": {
    required: true,
    showInfo: true,
    label: "Code IDCC de la convention collective appliquée : ",
    requiredMessage: "le code idcc est obligatoire",
    validateMessage: "le code IDCC n'est pas au bon format",
    mask: "C",
    maskBlocks: [
      {
        name: "C",
        mask: "Pattern",
        pattern: "^\\d*$",
      },
    ],
  },
  "employeur.codeIdcc_special": {
    fieldType: "radio",
    showInfo: true,
    autosave: false,
    label: "",
    options: [
      {
        label: "9999 - Sans convention collective",
        value: "9999",
      },
      {
        label: "9998 - Convention non encore en vigueur",
        value: "9998",
      },
    ],
  },
  "employeur.libelleIdcc": {
    // required: true ??,
    label: "Libellé de la convention collective appliquée:",
    requiredMessage: "Le libellé de la convention collective est obligatoire",
    isNotRequiredForm: true,
  },
  "employeur.regimeSpecifique": {
    required: true,
    label: "Adhésion de l'apprenti au régime spécifique d'assurance chômage : ",
    requiredMessage: "Cette déclaration est obligatoire",
    example: "Non",
    options: [
      {
        label: "Oui",
        value: true,
      },
      {
        label: "Non",
        value: false,
      },
    ],
  },
  "employeur.privePublic": {
    required: true,
    completion: false,
    showInfo: true,
    label: "Je suis : ",
    options: [
      {
        label: "Employeur public",
        value: true,
      },
      {
        label: "Employeur privé",
        value: false,
        locked: true,
      },
    ],
  },
};
