import { shouldAskEtablissementFormation } from "./domain/shouldAskEtablissementFormation";
import { INDICE_DE_REPETITION_OPTIONS } from "../../domain/indiceDeRepetionOptions";

export const formationSchema = {
  "etablissementFormation.memeResponsable": {
    fieldType: "radio",
    required: true,
    label: "Le lieu de formation est le même que l'organisme responsable",
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
  "etablissementFormation.denomination": {
    fieldType: "text",
    required: true,
    completion: shouldAskEtablissementFormation,
    label: "Dénomination du lieu de formation :",
    requiredMessage: "la dénomination du lieu de formation est obligatoire",
    mask: "C",
    maskBlocks: [
      {
        name: "C",
        mask: "Pattern",
        pattern: "^.*$",
      },
    ],
  },
  "etablissementFormation.siret": {
    fieldType: "text",
    completion: shouldAskEtablissementFormation,
    label: "N° SIRET du lieu de formation :",
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
  "etablissementFormation.uaiCfa": {
    fieldType: "text",
    completion: shouldAskEtablissementFormation,
    label: "N° UAI du CFA :",
    validateMessage: "n'est pas un uai valide",
  },
  "etablissementFormation.adresse.numero": {
    fieldType: "number",
    required: false,
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
  "etablissementFormation.adresse.repetitionVoie": {
    fieldType: "select",
    label: "Indice de répétition",
    validateMessage: `n'est pas un indice de répétition valide`,
    options: INDICE_DE_REPETITION_OPTIONS,
  },
  "etablissementFormation.adresse.voie": {
    fieldType: "text",
    required: true,
    completion: shouldAskEtablissementFormation,
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
  "etablissementFormation.adresse.complement": {
    fieldType: "text",
    required: false,
    label: "Complément d'adresse (optionnel):",
    requiredMessage: "le complement d'adress est obligatoire",
  },
  "etablissementFormation.adresse.codePostal": {
    fieldType: "text",
    required: true,
    completion: shouldAskEtablissementFormation,
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
  "etablissementFormation.adresse.commune": {
    fieldType: "text",
    required: true,
    completion: shouldAskEtablissementFormation,
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
  "formation.rncp": {
    fieldType: "text",
    required: true,
    label: "Code RNCP : ",
    requiredMessage: "Le code RNCP est obligatoire",
    validateMessage: "n'est pas un code RNCP valide. Le code RNCP doit être définit et contenir entre 3 et 5 chiffres",
    mask: "RNCPX",
    maskBlocks: [
      {
        name: "X",
        mask: "Pattern",
        pattern: "^\\d*$",
      },
    ],
    unmask: false,
    minLength: 7,
    maxLength: 9,
  },
  "formation.codeDiplome": {
    fieldType: "text",
    required: true,
    label: "Code diplôme (Éducation Nationale) : ",
    requiredMessage: "Le code diplôme est obligatoire",
    validateMessage:
      "n'est pas un code diplôme valide. Le code formation diplôme doit être au format 8 caractères ou 9 avec la lettre specialité",
  },
  "formation.typeDiplome": {
    fieldType: "select",
    required: true,
    options: [
      {
        name: "Diplôme ou titre de niveau bac +5 et plus",
        options: [
          {
            label: "80: Doctorat",
            value: 80,
          },
          {
            label: "71: Master professionnel/DESS",
            value: 71,
          },
          {
            label: "72: Master recherche/DEA",
            value: 72,
          },
          {
            label: "73: Master indifférencié",
            value: 73,
          },
          {
            label: "74: Diplôme d'ingénieur, diplôme d'école de commerce",
            value: 74,
          },
          {
            label: "79: Autre diplôme ou titre de niveau bac+5 ou plus",
            value: 79,
          },
        ],
      },
      {
        name: "Diplôme ou titre de niveau bac +3 et 4",
        options: [
          {
            label: "61: 1 ère année de Master",
            value: 61,
          },
          {
            label: "62: Licence professionnelle",
            value: 62,
          },
          {
            label: "63: Licence générale",
            value: 63,
          },
          {
            label: "69: Autre diplôme ou titre de niveau bac +3 ou 4",
            value: 69,
          },
        ],
      },
      {
        name: "Diplôme ou titre de niveau bac +2",
        options: [
          {
            label: "54: Brevet de Technicien Supérieur",
            value: 54,
          },
          {
            label: "55: Diplôme Universitaire de technologie",
            value: 55,
          },
          {
            label: "58: Autre diplôme ou titre de niveau bac+2",
            value: 58,
          },
        ],
      },
      {
        name: "Diplôme ou titre de niveau bac",
        options: [
          {
            label: "41: Baccalauréat professionnel",
            value: 41,
          },
          {
            label: "42: Baccalauréat général",
            value: 42,
          },
          {
            label: "43: Baccalauréat technologique",
            value: 43,
          },
          {
            label: "49: Autre diplôme ou titre de niveau bac",
            value: 49,
          },
        ],
      },
      {
        name: "Diplôme ou titre de niveau CAP/BEP",
        options: [
          {
            label: "33: CAP",
            value: 33,
          },
          {
            label: "34: BEP",
            value: 34,
          },
          {
            label: "35: Mention complémentaire",
            value: 35,
          },
          {
            label: "38: Autre diplôme ou titre de niveau CAP/BEP",
            value: 38,
          },
        ],
      },
      {
        name: "Aucun diplôme ni titre",
        options: [
          {
            label: "25: Diplôme national du Brevet",
            value: 25,
          },
          {
            label: "26: Certificat de formation générale",
            value: 26,
          },
          {
            label: "13: Aucun diplôme ni titre professionnel",
            value: 13,
          },
        ],
      },
    ],
    label: "Diplôme ou titre visé par l'apprenti :",
    requiredMessage: "Le diplôme ou titre visé est obligatoire",
    validateMessage: " n'est pas un diplôme ou titre valide",
  },
  "formation.intituleQualification": {
    fieldType: "text",
    required: true,
    label: "Intitulé précis :",
    requiredMessage: "L'intitulé du diplôme ou titre est obligatoire",
    validateMessage: " n'est pas un intitulé valide",
  },
  "formation.dateDebutFormation": {
    fieldType: "date",
    required: true,
    label: "Date de début du cycle de formation : ",
    requiredMessage: "la date de début de cycle est obligatoire",
    validateMessage: " n'est pas une date valide",
  },
  "formation.dateFinFormation": {
    fieldType: "date",
    required: true,
    label: "Date prévue de fin des épreuves ou examens : ",
    requiredMessage: "la date de fin de cycle est obligatoire",
    validateMessage: " n'est pas une date valide",
  },
  "formation.dureeFormationCalc": {},
  "formation.dureeFormation": {
    fieldType: "number",
    required: true,
    label: "Durée de la formation en heures :",
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
  },
  "formation.dateObtentionDiplome": { fieldType: "date" },
  "organismeFormation.denomination": {
    fieldType: "text",
    required: true,
    label: "Dénomination du CFA responsable :",
    requiredMessage: "la dénomination du CFA responsable est obligatoire",
    mask: "C",
    maskBlocks: [
      {
        name: "C",
        mask: "Pattern",
        pattern: "^.*$",
      },
    ],
  },
  "organismeFormation.formationInterne": {
    required: true,
    fieldType: "radio",
    completion: false,
    label: "Le centre de formation est-il un CFA d'entreprise ?",
    requiredMessage: "Merci de préciser s'il sagit d'un CFA d'entreprise",
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
  "organismeFormation.siret": {
    fieldType: "text",
    required: true,
    label: "N° SIRET du CFA responsable :",
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
  "organismeFormation.uaiCfa": {
    fieldType: "text",
    required: true,
    showInfo: true,
    label: "N° UAI du CFA :",
    requiredMessage: "Le N° UAI de l'organisme est obligatoire",
    validateMessage: "n'est pas un uai valide",
  },
  "organismeFormation.visaCfa": {
    showInfo: true,
  },
  "organismeFormation.adresse.numero": {
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
  "organismeFormation.adresse.repetitionVoie": {
    fieldType: "select",
    label: "Indice de répétition",
    validateMessage: `n'est pas un indice de répétition valide`,
    options: INDICE_DE_REPETITION_OPTIONS,
  },
  "organismeFormation.adresse.voie": {
    fieldType: "text",
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
  "organismeFormation.adresse.complement": {
    fieldType: "text",
    label: "Complément d'adresse (optionnel):",
    requiredMessage: "le complement d'adress est obligatoire",
  },
  "organismeFormation.adresse.codePostal": {
    fieldType: "text",
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
  "organismeFormation.adresse.commune": {
    fieldType: "text",
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
};
