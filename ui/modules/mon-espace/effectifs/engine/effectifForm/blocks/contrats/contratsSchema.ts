import { INDICE_DE_REPETITION_OPTIONS } from "@/modules/mon-espace/effectifs/engine/effectifForm/domain/indiceDeRepetionOptions";

export const contratsSchema = {
  "apprenant.nouveau_contrat": {
    autosave: false,
  },
  "contrats[].siret": {
    locked: true,
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
  "contrats[].denomination": {
    label: "Dénomination :",
    showInfo: true,
    locked: true,
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
  "contrats[].naf": {
    showInfo: true,
    locked: true,
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
  "contrats[].nombre_de_salaries": {
    fieldType: "number",
    showInfo: true,
    locked: true,
    label: "Effectif salarié de l'entreprise :",
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
  "contrats[].type_employeur": {
    label: "Type d'employeur :",
    showInfo: true,
    locked: true,
    options: [
      {
        name: "Privé",
        options: [
          {
            label:
              "11 Entreprise inscrite au répertoire des métiers ou au registre des entreprises pour l'Alsace-Moselle",
            value: 11,
          },
          {
            label: "12 Entreprise inscrite uniquement au registre du commerce et des sociétés",
            value: 12,
          },
          {
            label: "13 Entreprise dont les salariés relèvent de la mutualité sociale agricole",
            value: 13,
          },
          {
            label: "14 Profession libérale",
            value: 14,
          },
          {
            label: "15 Association",
            value: 15,
          },
          {
            label: "16 Autre employeur privé",
            value: 16,
          },
        ],
      },
      {
        name: "Public",
        options: [
          {
            label:
              "21 Service de l'État (administrations centrales et leurs services déconcentrés de la fonction publique d'État)",
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
            label: "27 Etablissement public administratif de l'État",
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
  "contrats[].date_debut": {
    label: "Date de début du contrat :",
    fieldType: "date",
    locked: true,
  },
  "contrats[].date_fin": {
    label: "Date de fin du contrat :",
    fieldType: "date",
    locked: true,
  },
  "contrats[].date_rupture": {
    label: "Date de rupture du contrat :",
    fieldType: "date",
    locked: true,
  },
  "contrats[].adresse.numero": {
    locked: true,
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
  "contrats[].adresse.repetition_voie": {
    locked: true,
    fieldType: "select",
    label: "Indice de répétition :",
    validateMessage: `n'est pas un indice de répétition valide`,
    options: INDICE_DE_REPETITION_OPTIONS,
  },
  "contrats[].adresse.voie": {
    locked: true,
    label: "Voie :",
    mask: "C",
    maskBlocks: [
      {
        name: "C",
        mask: "Pattern",
        pattern: "^.*$",
      },
    ],
  },
  "contrats[].adresse.complement": {
    label: "Complément d'adresse (optionnel):",
    locked: true,
  },
  "contrats[].adresse.code_postal": {
    locked: true,
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
  "contrats[].adresse.commune": {
    locked: true,
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
  "contrats[].adresse.departement": {
    locked: true,
    label: "Département de l'employeur :",
    requiredMessage: "le département de l'employeur est obligatoire",
    validateMessage: "Le département doit contenir 2 à 3 chiffres",
  },
  "contrats[].adresse.region": {
    locked: true,
    fieldType: "select",
    label: "Région de l'employeur :",
    requiredMessage: "la région de l'employeur est obligatoire",
    validateMessage: " n'est pas une région valide",
    options: [
      {
        label: "01 - Guadeloupe",
        value: "01",
      },
      {
        label: "02 - Martinique",
        value: "02",
      },
      {
        label: "03 - Guyane",
        value: "03",
      },
      {
        label: "04 - La Réunion",
        value: "04",
      },
      {
        label: "06 - Mayotte",
        value: "06",
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
};
