import { INDICE_DE_REPETITION_OPTIONS } from "@/modules/mon-espace/effectifs/engine/effectifForm/domain/indiceDeRepetionOptions";

import { shouldAskResponsalLegalAdresse } from "./domain/shouldAskResponsalLegalAdresse";

// import { shouldAskRepresentantLegal } from "./domain/shouldAskRepresentantLegal";

export const apprenantSchema = {
  "apprenant.ine": {
    showInfo: true,
    label: "Numéro INE de l'apprenant(e) :",
    // mask: "C",
    // maskBlocks: [
    //   {
    //     name: "C",
    //     mask: "Pattern",
    //     pattern: "^([0-9]{9}[a-zA-Z]{2}|[0-9]{10}[a-zA-Z]{1})$",
    //   },
    // ],
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
        pattern: "^.+$",
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
        pattern: "^.+$",
      },
    ],
  },
  "apprenant.sexe": {
    required: true,
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
    required: true,
    fieldType: "date",
    label: "Date de naissance :",
    showInfo: true,
  },
  "apprenant.adresse_naissance.code_postal": {
    label: "Code postal de naissance :",
    validateMessage: "n'est pas un code postal valide",
    showInfo: true,
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
  "apprenant.rqth": {
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
  "apprenant.date_rqth": {
    fieldType: "date",
    label: "Date de reconnaissance travailleur handicapé :",
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
    required: true,
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
    label: "Complément d'adresse :",
  },
  "apprenant.adresse.code_postal": {
    required: true,
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
    label: "Commune :",
    mask: "C",
    maskBlocks: [
      {
        name: "C",
        mask: "Pattern",
        pattern: "^.*$",
      },
    ],
  },
  "apprenant.adresse.complete": {
    label: "Complete :",
    locked: true,
    mask: "C",
    maskBlocks: [
      {
        name: "C",
        mask: "Pattern",
        pattern: "^.*$",
      },
    ],
  },
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
    label: "Nom du représentant légal :",
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
    label: "Prénom du représentant légal :",
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
  "apprenant.representant_legal.pcs": {
    fieldType: "select",
    label: "Professions et catégories socioprofessionnelles :",
    options: [
      { value: 10, label: "Agriculteur exploitant" },
      { value: 21, label: "Artisan" },
      { value: 22, label: "Commerçant et assimilé" },
      { value: 23, label: "Chef d'entreprise de 10 salariés ou plus" },
      { value: 31, label: "Profession libérale" },
      { value: 33, label: "Cadre de la fonction publique" },
      { value: 34, label: "Professeur et assimilé" },
      { value: 35, label: "Profession de l’information, des arts et du spectacle" },
      { value: 37, label: "Cadre administratif et commercial d'entreprise" },
      { value: 38, label: "Ingénieur - cadre technicien d'entreprise" },
      { value: 42, label: "Instituteur et assimilé" },
      { value: 43, label: "Profession intermédiaire de la santé ou du travail social" },
      { value: 44, label: "Clergé, religieux" },
      { value: 45, label: "Profession intermédiaire administratif Fonction Publique" },
      { value: 46, label: "Profession intermédiaire adm – commerciale d’entr." },
      { value: 47, label: "Technicien" },
      { value: 48, label: "Contremaître agent de maîtrise" },
      { value: 52, label: "Employé civil - agent service fonction publique" },
      { value: 53, label: "Policier et militaire" },
      { value: 54, label: "Employé administratif d'entreprise" },
      { value: 55, label: "Employé de commerce" },
      { value: 56, label: "Personnel, service direct aux particuliers" },
      { value: 61, label: "Ouvrier qualifié" },
      { value: 66, label: "Ouvrier non qualifié" },
      { value: 69, label: "Ouvrier agricole" },
      { value: 71, label: "Retraité agriculteur exploitant" },
      { value: 72, label: "Retraité artisan commerçant chef d'entreprise." },
      { value: 73, label: "Retraité cadre profession intermédiaire" },
      { value: 76, label: "Retraité employé et ouvrier" },
      { value: 81, label: "Chômeur n'ayant jamais travaillé" },
      { value: 82, label: "Personne sans activité professionnelle" },
      { value: 99, label: "Non renseigné (inconnu ou sans objet)" },
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
        label: "11 Scolarité type collège (y. c. SEGPA, DIMA, CPA, CLIPA,MFR,...)",
        value: 11,
      },
      {
        label: "12 Autres instituts médico-éducatifs et pédagogiques (IME, IMP)",
        value: 12,
      },
      {
        label: "21 Second cycle général et technologique",
        value: 21,
      },
      {
        label: "31 Second cycle professionnel (lycée professionnel, MFR, ...)",
        value: 31,
      },
      {
        label: "41 Enseignement supérieur (y. c. CPGE)",
        value: 41,
      },
      {
        label: "51 Contrat de professionnalisation",
        value: 51,
      },
      {
        label: "52 Stagiaire",
        value: 52,
      },
      {
        label: "53 En emploi",
        value: 53,
      },
      {
        label: "54 Demandeur d’emploi, chômage",
        value: 54,
      },
      {
        label: "90 Autre situation",
        value: 90,
      },
      {
        label: "99 INCONNUE",
        value: 99,
      },
    ],
  },
  "apprenant.derniere_situation": {
    fieldType: "select",
    label: "Situation de l'apprenant l’année dernière (N-1) :",
    options: [
      {
        name: "Sans situation",
        options: [
          { label: "Non renseigné", value: null },
          { label: "0 – Aucune situation", value: 0 },
        ],
      },
      {
        name: "1er cycle second degré",
        options: [
          {
            label: "1003 6ème (y compris SEGPA)",
            value: 1003,
          },
          {
            label: "1005 5ème (y compris SEGPA)",
            value: 1005,
          },
          {
            label: "1009 Instituts médico-éducatifs et pédagogiques (IME, IMP)",
            value: 1009,
          },
          {
            label: "1017 4ème générale",
            value: 1017,
          },
          {
            label: "1019 Autres 4ème (agricole, SEGPA...)",
            value: 1019,
          },
          {
            label: "1021 3ème générale",
            value: 1021,
          },
          {
            label: "1023 Autres 3ème (agricole, insertion, projet professionnel,SGEPA..)",
            value: 1023,
          },
        ],
      },
      {
        name: "2nd cycle : enseignement général et technologique",
        options: [
          {
            label: "2001 2nde générale ou technologique (y compris agricole et BT)",
            value: 2001,
          },
          {
            label: "2003 1ère générale ou technologique (y compris agricole, d'adaptation et BT)",
            value: 2003,
          },
          {
            label: "2005 Terminale générale",
            value: 2005,
          },
          {
            label: "2007 Terminale technologique (y compris agricole et BT)",
            value: 2007,
          },
        ],
      },
      {
        name: "2nd cycle : enseignement professionnel",
        options: [
          {
            label: "3001 1A CAP 2 ans SCOLAIRE",
            value: 3001,
          },
          {
            label: "3101 1A CAP 2 ans APPRENTI",
            value: 3101,
          },
          {
            label: "3003 Année terminale de CAP SCOLAIRE",
            value: 3003,
          },
          {
            label: "3103 Année terminale de CAP APPRENTI",
            value: 3103,
          },
          {
            label: "3009 Mention complémentaire de niveau 3 (ex niveau V) SCOLAIRE",
            value: 3009,
          },
          {
            label: "3109 Mention complémentaire de niveau 3 (ex niveau V) APPRENTI",
            value: 3109,
          },
          {
            label: "3011 Autre diplôme et certification de niveau 3 (ex niveau V) SCOLAIRE",
            value: 3011,
          },
          {
            label: "3111 Autre diplôme et certification de niveau 3 (ex niveau V) APPRENTI",
            value: 3111,
          },
          {
            label: "3031 1A BAC PRO 3 ans (2nde professionnelle) SCOLAIRE",
            value: 3031,
          },
          {
            label: "3131 1A BAC PRO 3 ans (2nde professionnelle) APPRENTI",
            value: 3131,
          },
          {
            label: "3032 2A BAC PRO 3 ans (1ère professionnelle) SCOLAIRE",
            value: 3032,
          },
          {
            label: "3132 2A BAC PRO 3 ans (1ère professionnelle) APPRENTI",
            value: 3132,
          },
          {
            label: "3033 BAC PRO 3 ans (Terminale professionnelle) SCOLAIRE",
            value: 3033,
          },
          {
            label: "3133 BAC PRO 3 ans (Terminale professionnelle) APPRENTI",
            value: 3133,
          },
          {
            label: "3117 1A de Brevet Professionnel (BP)",
            value: 3117,
          },
          {
            label: "3119 Année terminale de Brevet Professionnel",
            value: 3119,
          },
          {
            label: "3021 Mention complémentaire de niveau 4 (ex niveau IV) SCOLAIRE",
            value: 3021,
          },
          {
            label: "3121 Mention complémentaire de niveau 4 (ex niveau IV) APPRENTI",
            value: 3121,
          },
          {
            label: "3023 Autre diplôme et certification de niveau 4 (y compris BP JEPS) (ex niveau IV) SCOLAIRE",
            value: 3023,
          },
          {
            label: "3123 Autre diplôme et certification de niveau 4 (y compris BP JEPS) (ex niveau IV) APPRENTI",
            value: 3123,
          },
        ],
      },
      {
        name: "Enseignement supérieur",
        options: [
          {
            label: "4001 1A de BTS SCOLAIRE",
            value: 4001,
          },
          {
            label: "4101 1A de BTS APPRENTI",
            value: 4101,
          },
          {
            label: "4003 Année terminale de BTS SCOLAIRE",
            value: 4003,
          },
          {
            label: "4103 Année terminale de BTS APPRENTI",
            value: 4103,
          },
          {
            label: "4005 1A de DUT SCOLAIRE",
            value: 4005,
          },
          {
            label: "4105 1A de DUT APPRENTI",
            value: 4105,
          },
          {
            label: "4007 Année terminale de DUT SCOLAIRE",
            value: 4007,
          },
          {
            label: "4107 Année terminale de DUT APPRENTI",
            value: 4107,
          },
          {
            label: "4009 Classe Préparatoire aux Grandes Ecoles (CPGE)",
            value: 4009,
          },
          {
            label: "4011 Cursus Licence (licence LMD, licence pro, ...) SCOLAIRE",
            value: 4011,
          },
          {
            label: "4111 Cursus Licence (licence LMD, licence pro, ...) APPRENTI",
            value: 4111,
          },
          {
            label: "4013 Cursus Master (master LMD, master pro) SCOLAIRE",
            value: 4013,
          },
          {
            label: "4113 Cursus Master (master LMD, master pro) APPRENTI",
            value: 4113,
          },
          {
            label: "4015 Diplôme d'ingénieur ou d'école de commerce de niveaux 7 et 8 (ex niveau 1) SCOLAIRE",
            value: 4015,
          },
          {
            label: "4115 Diplôme d'ingénieur ou d'école de commerce de niveaux 7 et 8 (ex niveau 1) APPRENTI",
            value: 4115,
          },
          {
            label: "4017 Autre diplôme du supérieur ou certification (Bac +1 ou 2) niveau 5 (ex niveau 3) SCOLAIRE",
            value: 4017,
          },
          {
            label: "4117 Autre diplôme du supérieur ou certification (Bac +1 ou 2) niveau 5 (ex niveau 3) APPRENTI",
            value: 4117,
          },
          {
            label: "4019 Autre diplôme du supérieur ou certification (Bac +3 ou 4) niveau 6 (ex niveau 2) SCOLAIRE",
            value: 4019,
          },
          {
            label: "4119 Autre diplôme du supérieur ou certification (Bac +3 ou 4) niveau 6 (ex niveau 2) APPRENTI",
            value: 4119,
          },
          {
            label:
              "4021 Autre diplôme du supérieur ou certification (Bac +5 ou plus) niveaux 7 et 8 (ex niveau 1) SCOLAIRE",
            value: 4021,
          },
          {
            label:
              "4121 Autre diplôme du supérieur ou certification (Bac +5 ou plus) niveaux 7 et 8 (ex niveau 1) APPRENTI",
            value: 4121,
          },
        ],
      },
      {
        name: "Autres",
        options: [
          {
            label: "5901 Contrat de professionnalisation",
            value: 5901,
          },
          {
            label: "5903 Emploi",
            value: 5903,
          },
          {
            label: "5905 Stage",
            value: 5905,
          },
          {
            label: "5907 Sans emploi",
            value: 5907,
          },
          {
            label: "5909 Formation continue (tous niveaux de formation)",
            value: 5909,
          },
          {
            label: "9900 Autre",
            value: 9900,
          },
          {
            label: "9999 Inconnu",
            value: 9999,
          },
        ],
      },
    ],
  },
  "apprenant.dernier_organisme_uai": {
    fieldType: "text",
    showInfo: true,
    label: "Établissement fréquenté l’année dernière (N-1) :",
    placeholder: "Numéro UAI ou département",
  },
  "apprenant.type_cfa": {
    fieldType: "select",
    label: "Type de CFA :",
    options: [
      { value: "01", label: "01 CFA public (éducation nationale)" },
      { value: "02", label: "02 CFA public (enseignement supérieur)" },
      { value: "03", label: "03 CFA public agricole" },
      { value: "04", label: "04 CFA de collectivité territoriale" },
      { value: "05", label: "05 Autre CFA public" },
      { value: "06", label: "06 CFA consulaire" },
      { value: "07", label: "07 CFA de branche" },
      { value: "08", label: "08 CFA d’entreprise" },
      { value: "09", label: "09 CFA associatif" },
      { value: "10", label: "10 Autre CFA privé" },
    ],
    showApplyAllOption: true,
  },
  "apprenant.dernier_diplome": {
    fieldType: "select",
    label: "Dernier diplôme obtenu :",
    options: [
      {
        label: "1 Aucun diplôme",
        value: 1,
      },
      {
        label: "2 Certificat de formation générale (obtenu après une 3ème d’insertion ou une SEGPA)",
        value: 2,
      },
      {
        label: "3 Brevet des collèges",
        value: 3,
      },
      {
        label: "4 CAP / CAPA",
        value: 4,
      },
      {
        label: "5 BEP / BEPA",
        value: 5,
      },
      {
        label: "6 Autre diplôme de niveau 3 (ex niveau V)",
        value: 6,
      },
      {
        label: "7 Bac général ou technologique",
        value: 7,
      },
      {
        label: "8 Bac professionnel / Bac professionnel agricole",
        value: 8,
      },
      {
        label: "9 Brevet professionnel / BPA / Brevet de maîtrise",
        value: 9,
      },
      {
        label: "10 Autre diplôme de niveau 4 (niveau Bac) (ex niveau IV)",
        value: 10,
      },
      {
        label: "11 BTS / BTSA",
        value: 11,
      },
      {
        label: "12 DUT",
        value: 12,
      },
      {
        label: "13 Autre diplôme de niveau 5 (bac + 2) (ex niveau III)",
        value: 13,
      },
      {
        label: "14 Diplôme de niveaux 6, 7 et 8 (bac + 3 ou plus) (ex niveaux II ou I)",
        value: 14,
      },
      {
        label: "15 BUT Bachelor Universitaire de Technologie",
        value: 15,
      },
      {
        label: "99 Inconnu",
        value: 99,
      },
    ],
  },
  "apprenant.regime_scolaire": {
    fieldType: "select",
    label: "Régime scolaire :",
    options: [
      {
        label: "I : Interne",
        value: "I",
      },
      {
        label: "D : Demi-pensionnaire",
        value: "D",
      },
      {
        label: "E : Externe",
        value: "E",
      },
      {
        label: "IE : Interne externé",
        value: "IE",
      },
    ],
  },
};
