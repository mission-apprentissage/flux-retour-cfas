import { INDICE_DE_REPETITION_OPTIONS } from "../../domain/indiceDeRepetionOptions";

export const apprenantSchema = {
  "apprenant.ine": {
    showInfo: true,
    label: "Numéro INE de l'apprenant(e) :",
    mask: "C",
    maskBlocks: [
      {
        name: "C",
        mask: "Pattern",
        pattern: "^\\D*$",
      },
    ],
  },
  "apprenant.nom": {
    required: true,
    showInfo: true,
    label: "Nom de naissance de l'apprenant(e) :",
    requiredMessage: "Le nom de l'apprenant(e) est obligatoire",
    mask: "C",
    maskBlocks: [
      {
        name: "C",
        mask: "Pattern",
        pattern: "^\\D*$",
      },
    ],
  },
  "apprenant.prenom": {
    required: true,
    showInfo: true,
    label: "Prénom de l'apprenant(e) :",
    requiredMessage: "Le prénom de l'apprenant(e) est obligatoire",
    mask: "C",
    maskBlocks: [
      {
        name: "C",
        mask: "Pattern",
        pattern: "^\\D*$",
      },
    ],
  },
  "apprenant.sexe": {
    required: false,
    fieldType: "radio",
    label: "Sexe :",
    options: [
      {
        label: "M : Homme",
        value: "M",
      },
      {
        label: "F : Femme",
        value: "F",
      },
    ],
  },
  "apprenant.date_de_naissance": {
    fieldType: "date",
    label: "Date de naissance :",
    showInfo: true,
  },
  "apprenant.nationalite": {
    fieldType: "select",
    label: "Nationalité :",
    showInfo: true,
    options: [
      {
        label: "1: Française",
        value: 1,
      },
      {
        label: "2: Union Européenne",
        value: 2,
      },
      {
        label: "3: Etranger hors Union Européenne",
        value: 3,
      },
    ],
  },
  "apprenant.handicap": {
    fieldType: "radio",
    label: "Déclare bénéficier de la reconnaissance travailleur handicapé :",
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
  "apprenant.courriel": {
    fieldType: "email",
    label: "Courriel de l'apprenant(e) :",
    mask: "C",
    maskBlocks: [
      {
        name: "C",
        mask: "Pattern",
        pattern: "^.*$",
      },
    ],
  },
  "apprenant.telephone": {
    fieldType: "phone",
    label: "Téléphone de l'apprenant(e) :",
    showInfo: true,
  },
  "apprenant.adresse.numero": {
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
  "apprenant.adresse.repetition_voie": {
    fieldType: "select",
    label: "Indice de répétition",
    validateMessage: `n'est pas un indice de répétition valide`,
    options: INDICE_DE_REPETITION_OPTIONS,
  },
  "apprenant.adresse.voie": {
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
  "apprenant.adresse.complement": {
    label: "Complément d'adresse:",
  },
  "apprenant.adresse.code_postal": {
    label: "Code postal :",
    validateMessage: "n'est pas un code postal valide",
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
  "apprenant.adresse.code_insee": {
    label: "Code commune insee :",
    validateMessage: "n'est pas un code insee valide",
    pattern: "^[0-9]{1}[0-9A-Z]{1}[0-9]{3}$",
    mask: "C",
    maskBlocks: [
      {
        name: "C",
        mask: "Pattern",
        pattern: "^\\d*$",
      },
    ],
  },
  "apprenant.adresse.commune": {
    label: "Commune: ",
    mask: "C",
    maskBlocks: [
      {
        name: "C",
        mask: "Pattern",
        pattern: "^.*$",
      },
    ],
  },
  //historique_statut
};
