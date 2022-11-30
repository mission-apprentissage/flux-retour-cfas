import { INDICE_DE_REPETITION_OPTIONS } from "../../domain/indiceDeRepetionOptions";
// import { shouldAskRepresentantLegal } from "./domain/shouldAskRepresentantLegal";
import { shouldAskResponsalLegalAdresse } from "./domain/shouldAskResponsalLegalAdresse";

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
  "apprenant.code_postal_de_naissance": {
    label: "Code postal de naissance :",
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
  "apprenant.inscription_sportif_haut_niveau": {
    fieldType: "radio",
    label: "Déclare être inscrit sur la liste des sportifs, entraîneurs, arbitres et juges sportifs de haut niveau :",
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

  "apprenant.mineur_emancipe": {
    fieldType: "radio",
    label: "L'apprenant(e) est émancipé ? Si non est sous la responsabilité d'un représentant légal",
    showInfo: true,
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
  "apprenant.representant_legal.nom": {
    label: "Nom du représentant légal:",
    mask: "C",
    maskBlocks: [
      {
        name: "C",
        mask: "Pattern",
        pattern: "^\\D*$",
      },
    ],
  },
  "apprenant.representant_legal.prenom": {
    label: "Prénom du représentant légal:",
    mask: "C",
    maskBlocks: [
      {
        name: "C",
        mask: "Pattern",
        pattern: "^\\D*$",
      },
    ],
  },
  "apprenant.representant_legal.courriel": {
    // _init: ({ values }) => ({ required: shouldAskRepresentantLegal({ values }) }), // TODO
    fieldType: "email",
    label: "Courriel du représentant légal :",
    mask: "C",
    maskBlocks: [
      {
        name: "C",
        mask: "Pattern",
        pattern: "^.*$",
      },
    ],
  },
  "apprenant.representant_legal.telephone": {
    // _init: ({ values }) => ({ required: shouldAskRepresentantLegal({ values }) }), // TODO
    fieldType: "phone",
    label: "Téléphone du représentant légal :",
    showInfo: true,
  },
  "apprenant.representant_legal.meme_adresse": {
    showInfo: true,
    label: "L'apprenant(e) vit à la même adresse que son représentant légal",
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
  "apprenant.representant_legal.adresse.numero": {
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
  "apprenant.representant_legal.adresse.repetition_voie": {
    fieldType: "select",
    label: "Indice de répétition",
    validateMessage: `n'est pas un indice de répétition valide`,
    options: INDICE_DE_REPETITION_OPTIONS,
  },
  "apprenant.representant_legal.adresse.voie": {
    _init: ({ values }) => ({ required: shouldAskResponsalLegalAdresse({ values }) }),
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
  "apprenant.representant_legal.adresse.complement": {
    required: false,
    label: "Complément d'adresse (optionnel):",
    requiredMessage: "le complement d'adress est obligatoire",
  },
  "apprenant.representant_legal.adresse.code_postal": {
    _init: ({ values }) => ({ required: shouldAskResponsalLegalAdresse({ values }) }),
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
  "apprenant.representant_legal.adresse.commune": {
    _init: ({ values }) => ({ required: shouldAskResponsalLegalAdresse({ values }) }),
    maxLength: 80,
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

  "apprenant.situation_avant_contrat": {
    fieldType: "select",
    label: "Situation avant contrat :",
    options: [
      {
        label: "1 Scolaire",
        value: 1,
      },
      {
        label: "2 Prépa apprentissage",
        value: 2,
      },
      {
        label: "3 Etudiant",
        value: 3,
      },
      {
        label: "4 Contrat d'apprentissage",
        value: 4,
      },
      {
        label: "5 Contrat de professionnalisation",
        value: 5,
      },
      {
        label: "6 Contrat aidé",
        value: 6,
      },
      {
        label:
          "7 En formation au CFA sous statut de stagiaire de la formation professionnelle, avant signature d'un contrat d'apprentissage (L6222-12-1 du code du travail)",
        value: 7,
      },
      {
        label:
          "8 En formation, au CFA sans contrat sous statut de stagiaire de la formation professionnelle, suite à rupture (5° de L6231-2 du code du travail)",
        value: 8,
      },
      {
        label: "9 Autres situations sous statut de stagiaire de la formation professionnelle",
        value: 9,
      },
      {
        label: "10 Salarié",
        value: 10,
      },
      {
        label: "11 Personne à la recherche d'un emploi (inscrite ou non à Pôle Emploi)",
        value: 11,
      },
      {
        label: "12 Inactif",
        value: 12,
      },
    ],
  },

  "apprenant.derniere_situation": {
    fieldType: "select",
    label: "Situation de l'apprenant n-1 :",
    options: [
      {
        label: "1 Scolaire",
        value: 1,
      },
      {
        label: "2 Prépa apprentissage",
        value: 2,
      },
      {
        label: "3 Etudiant",
        value: 3,
      },
      {
        label: "4 Contrat d'apprentissage",
        value: 4,
      },
      {
        label: "5 Contrat de professionnalisation",
        value: 5,
      },
      {
        label: "6 Contrat aidé",
        value: 6,
      },
      {
        label:
          "7 En formation au CFA sous statut de stagiaire de la formation professionnelle, avant signature d'un contrat d'apprentissage (L6222-12-1 du code du travail)",
        value: 7,
      },
      {
        label:
          "8 En formation, au CFA sans contrat sous statut de stagiaire de la formation professionnelle, suite à rupture (5° de L6231-2 du code du travail)",
        value: 8,
      },
      {
        label: "9 Autres situations sous statut de stagiaire de la formation professionnelle",
        value: 9,
      },
      {
        label: "10 Salarié",
        value: 10,
      },
      {
        label: "11 Personne à la recherche d'un emploi (inscrite ou non à Pôle Emploi)",
        value: 11,
      },
      {
        label: "12 Inactif",
        value: 12,
      },
    ],
  },

  "apprenant.dernier_diplome": {
    fieldType: "select",
    label: "Dernier diplôme obtenu :",
    options: [
      {
        label: "1 Scolaire",
        value: 1,
      },
      {
        label: "2 Prépa apprentissage",
        value: 2,
      },
      {
        label: "3 Etudiant",
        value: 3,
      },
      {
        label: "4 Contrat d'apprentissage",
        value: 4,
      },
      {
        label: "5 Contrat de professionnalisation",
        value: 5,
      },
      {
        label: "6 Contrat aidé",
        value: 6,
      },
      {
        label:
          "7 En formation au CFA sous statut de stagiaire de la formation professionnelle, avant signature d'un contrat d'apprentissage (L6222-12-1 du code du travail)",
        value: 7,
      },
      {
        label:
          "8 En formation, au CFA sans contrat sous statut de stagiaire de la formation professionnelle, suite à rupture (5° de L6231-2 du code du travail)",
        value: 8,
      },
      {
        label: "9 Autres situations sous statut de stagiaire de la formation professionnelle",
        value: 9,
      },
      {
        label: "10 Salarié",
        value: 10,
      },
      {
        label: "11 Personne à la recherche d'un emploi (inscrite ou non à Pôle Emploi)",
        value: 11,
      },
      {
        label: "12 Inactif",
        value: 12,
      },
    ],
  },

  "apprenant.regime_scolaire": {
    fieldType: "select",
    label: "Régime scolaire :",
    options: [
      {
        label: "1 MSA",
        value: 1,
      },
      {
        label: "2 URSSAF",
        value: 2,
      },
    ],
  },
};
