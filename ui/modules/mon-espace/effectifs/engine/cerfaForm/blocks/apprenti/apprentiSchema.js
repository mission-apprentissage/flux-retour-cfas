import { shouldAskRepresentantLegal } from "./domain/shouldAskRepresentantLegal";
import { shouldAskResponsalLegalAdresse } from "./domain/shouldAskResponsalLegalAdresse";
import { INDICE_DE_REPETITION_OPTIONS } from "../../domain/indiceDeRepetionOptions";

export const apprentiSchema = {
  "apprenti.nom": {
    required: true,
    showInfo: true,
    label: "Nom de naissance de l'apprenti(e) :",
    requiredMessage: "Le nom de l'apprenti(e) est obligatoire",
    mask: "C",
    maskBlocks: [
      {
        name: "C",
        mask: "Pattern",
        pattern: "^\\D*$",
      },
    ],
  },
  "apprenti.prenom": {
    required: true,
    showInfo: true,
    label: "Prénom de l'apprenti(e) :",
    requiredMessage: "Le prénom de l'apprenti(e) est obligatoire",
    mask: "C",
    maskBlocks: [
      {
        name: "C",
        mask: "Pattern",
        pattern: "^\\D*$",
      },
    ],
  },
  "apprenti.adresse.numero": {
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
  "apprenti.adresse.repetitionVoie": {
    fieldType: "select",
    label: "Indice de répétition",
    validateMessage: `n'est pas un indice de répétition valide`,
    options: INDICE_DE_REPETITION_OPTIONS,
  },
  "apprenti.adresse.voie": {
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
  "apprenti.adresse.complement": {
    label: "Complément d'adresse (optionnel):",
    requiredMessage: "le complement d'adress est obligatoire",
  },
  "apprenti.adresse.codePostal": {
    required: true,
    label: "Code postal :",
    requiredMessage: "Le code postal est obligatoire",
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
  "apprenti.adresse.commune": {
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
  "apprenti.adresse.pays": {
    required: true,
    fieldType: "select",
    label: "Pays :",
    requiredMessage: "le pays est obligatoire",
    completion: false,
    options: [
      {
        label: "Afghanistan",
        value: "AF",
      },
      {
        label: "Afrique du sud",
        value: "ZA",
      },
      {
        label: "Albanie",
        value: "AL",
      },
      {
        label: "Algerie",
        value: "DZ",
      },
      {
        label: "Allemagne",
        value: "DE",
      },
      {
        label: "Andorre",
        value: "AD",
      },
      {
        label: "Angola",
        value: "AO",
      },
      {
        label: "Antigua-et-barbuda",
        value: "AG",
      },
      {
        label: "Arabie saoudite",
        value: "SA",
      },
      {
        label: "Argentine",
        value: "AR",
      },
      {
        label: "Armenie",
        value: "AM",
      },
      {
        label: "Australie",
        value: "AU",
      },
      {
        label: "Autriche",
        value: "AT",
      },
      {
        label: "Azerbaidjan",
        value: "AZ",
      },
      {
        label: "Bahamas",
        value: "BS",
      },
      {
        label: "Bahrein",
        value: "BH",
      },
      {
        label: "Bangladesh",
        value: "BD",
      },
      {
        label: "Barbade",
        value: "BB",
      },
      {
        label: "Belgique",
        value: "BE",
      },
      {
        label: "Belize",
        value: "BZ",
      },
      {
        label: "Benin",
        value: "BJ",
      },
      {
        label: "Bhoutan",
        value: "BT",
      },
      {
        label: "Bielorussie",
        value: "BY",
      },
      {
        label: "Birmanie",
        value: "MM",
      },
      {
        label: "Bolivie",
        value: "BO",
      },
      {
        label: "Bonaire, saint eustache et saba",
        value: "BQ",
      },
      {
        label: "Bosnie-herzegovine",
        value: "BA",
      },
      {
        label: "Botswana",
        value: "BW",
      },
      {
        label: "Bresil",
        value: "BR",
      },
      {
        label: "Brunei",
        value: "BN",
      },
      {
        label: "Bulgarie",
        value: "BG",
      },
      {
        label: "Burkina",
        value: "BF",
      },
      {
        label: "Burundi",
        value: "BI",
      },
      {
        label: "Cambodge",
        value: "KH",
      },
      {
        label: "Cameroun",
        value: "CM",
      },
      {
        label: "Canada",
        value: "CA",
      },
      {
        label: "Cap-vert",
        value: "CV",
      },
      {
        label: "Centrafricaine (republique)",
        value: "CF",
      },
      {
        label: "Chili",
        value: "CL",
      },
      {
        label: "Chine",
        value: "CN",
      },
      {
        label: "Chypre",
        value: "CY",
      },
      {
        label: "Colombie",
        value: "CO",
      },
      {
        label: "Comores",
        value: "KM",
      },
      {
        label: "Congo",
        value: "CG",
      },
      {
        label: "Congo (republique democratique)",
        value: "CD",
      },
      {
        label: "Coree (republique de)",
        value: "KR",
      },
      {
        label: "Coree (republique populaire democratique de)",
        value: "KP",
      },
      {
        label: "Costa rica",
        value: "CR",
      },
      {
        label: "Cote d'ivoire",
        value: "CI",
      },
      {
        label: "Croatie",
        value: "HR",
      },
      {
        label: "Cuba",
        value: "CU",
      },
      {
        label: "Curaçao",
        value: "CW",
      },
      {
        label: "Danemark",
        value: "DK",
      },
      {
        label: "Djibouti",
        value: "DJ",
      },
      {
        label: "Dominicaine (republique)",
        value: "DO",
      },
      {
        label: "Dominique",
        value: "DM",
      },
      {
        label: "Egypte",
        value: "EG",
      },
      {
        label: "El salvador",
        value: "SV",
      },
      {
        label: "Emirats arabes unis",
        value: "AE",
      },
      {
        label: "Equateur",
        value: "EC",
      },
      {
        label: "Erythree",
        value: "ER",
      },
      {
        label: "Espagne",
        value: "ES",
      },
      {
        label: "Estonie",
        value: "EE",
      },
      {
        label: "Eswatini",
        value: "SZ",
      },
      {
        label: "Etats-unis",
        value: "US",
      },
      {
        label: "Ethiopie",
        value: "ET",
      },
      {
        label: "Ex-republique yougoslave de macedoine",
        value: "MK",
      },
      {
        label: "Fidji",
        value: "FJ",
      },
      {
        label: "Finlande",
        value: "FI",
      },
      {
        label: "France",
        value: "FR",
      },
      {
        label: "Gabon",
        value: "GA",
      },
      {
        label: "Gambie",
        value: "GM",
      },
      {
        label: "Georgie",
        value: "GE",
      },
      {
        label: "Ghana",
        value: "GH",
      },
      {
        label: "Grece",
        value: "GR",
      },
      {
        label: "Grenade",
        value: "GD",
      },
      {
        label: "Guatemala",
        value: "GT",
      },
      {
        label: "Guinee",
        value: "GN",
      },
      {
        label: "Guinee equatoriale",
        value: "GQ",
      },
      {
        label: "Guinee-bissau",
        value: "GW",
      },
      {
        label: "Guyana",
        value: "GY",
      },
      {
        label: "Haiti",
        value: "HT",
      },
      {
        label: "Honduras",
        value: "HN",
      },
      {
        label: "Hongrie",
        value: "HU",
      },
      {
        label: "Inde",
        value: "IN",
      },
      {
        label: "Indonesie",
        value: "ID",
      },
      {
        label: "Iran",
        value: "IR",
      },
      {
        label: "Iraq",
        value: "IQ",
      },
      {
        label: "Irlande, ou eire",
        value: "IE",
      },
      {
        label: "Islande",
        value: "IS",
      },
      {
        label: "Israel",
        value: "IL",
      },
      {
        label: "Italie",
        value: "IT",
      },
      {
        label: "Jamaique",
        value: "JM",
      },
      {
        label: "Japon",
        value: "JP",
      },
      {
        label: "Jordanie",
        value: "JO",
      },
      {
        label: "Kazakhstan",
        value: "KZ",
      },
      {
        label: "Kenya",
        value: "KE",
      },
      {
        label: "Kirghizistan",
        value: "KG",
      },
      {
        label: "Kiribati",
        value: "KI",
      },
      {
        label: "Kosovo",
        value: "XK",
      },
      {
        label: "Koweit",
        value: "KW",
      },
      {
        label: "Laos",
        value: "LA",
      },
      {
        label: "Lesotho",
        value: "LS",
      },
      {
        label: "Lettonie",
        value: "LV",
      },
      {
        label: "Liban",
        value: "LB",
      },
      {
        label: "Liberia",
        value: "LR",
      },
      {
        label: "Libye",
        value: "LY",
      },
      {
        label: "Liechtenstein",
        value: "LI",
      },
      {
        label: "Lituanie",
        value: "LT",
      },
      {
        label: "Luxembourg",
        value: "LU",
      },
      {
        label: "Madagascar",
        value: "MG",
      },
      {
        label: "Malaisie",
        value: "MY",
      },
      {
        label: "Malawi",
        value: "MW",
      },
      {
        label: "Maldives",
        value: "MV",
      },
      {
        label: "Mali",
        value: "ML",
      },
      {
        label: "Malte",
        value: "MT",
      },
      {
        label: "Maroc",
        value: "MA",
      },
      {
        label: "Marshall (iles)",
        value: "MH",
      },
      {
        label: "Maurice",
        value: "MU",
      },
      {
        label: "Mauritanie",
        value: "MR",
      },
      {
        label: "Mexique",
        value: "MX",
      },
      {
        label: "Micronesie (etats federes de)",
        value: "FM",
      },
      {
        label: "Moldavie",
        value: "MD",
      },
      {
        label: "Monaco",
        value: "MC",
      },
      {
        label: "Mongolie",
        value: "MN",
      },
      {
        label: "Montenegro",
        value: "ME",
      },
      {
        label: "Mozambique",
        value: "MZ",
      },
      {
        label: "Namibie",
        value: "NA",
      },
      {
        label: "Nauru",
        value: "NR",
      },
      {
        label: "Nepal",
        value: "NP",
      },
      {
        label: "Nicaragua",
        value: "NI",
      },
      {
        label: "Niger",
        value: "NE",
      },
      {
        label: "Nigeria",
        value: "NG",
      },
      {
        label: "Norvege",
        value: "NO",
      },
      {
        label: "Nouvelle-zelande",
        value: "NZ",
      },
      {
        label: "Oman",
        value: "OM",
      },
      {
        label: "Ouganda",
        value: "UG",
      },
      {
        label: "Ouzbekistan",
        value: "UZ",
      },
      {
        label: "Pakistan",
        value: "PK",
      },
      {
        label: "Palaos (iles)",
        value: "PW",
      },
      {
        label: "Palestine (etat de)",
        value: "PS",
      },
      {
        label: "Panama",
        value: "PA",
      },
      {
        label: "Papouasie-nouvelle-guinee",
        value: "PG",
      },
      {
        label: "Paraguay",
        value: "PY",
      },
      {
        label: "Pays-bas",
        value: "NL",
      },
      {
        label: "Perou",
        value: "PE",
      },
      {
        label: "Philippines",
        value: "PH",
      },
      {
        label: "Pologne",
        value: "PL",
      },
      {
        label: "Portugal",
        value: "PT",
      },
      {
        label: "Qatar",
        value: "QA",
      },
      {
        label: "Roumanie",
        value: "RO",
      },
      {
        label: "Royaume-uni",
        value: "GB",
      },
      {
        label: "Russie",
        value: "RU",
      },
      {
        label: "Rwanda",
        value: "RW",
      },
      {
        label: "Saint-christophe-et-nieves",
        value: "KN",
      },
      {
        label: "Saint-marin",
        value: "SM",
      },
      {
        label: "Saint-martin (partie neerlandaise)",
        value: "SX",
      },
      {
        label: "Saint-vincent-et-les grenadines",
        value: "VC",
      },
      {
        label: "Sainte-lucie",
        value: "LC",
      },
      {
        label: "Salomon (iles)",
        value: "SB",
      },
      {
        label: "Samoa occidentales",
        value: "WS",
      },
      {
        label: "Sao tome-et-principe",
        value: "ST",
      },
      {
        label: "Senegal",
        value: "SN",
      },
      {
        label: "Serbie",
        value: "RS",
      },
      {
        label: "Seychelles",
        value: "SC",
      },
      {
        label: "Sierra leone",
        value: "SL",
      },
      {
        label: "Singapour",
        value: "SG",
      },
      {
        label: "Slovaquie",
        value: "SK",
      },
      {
        label: "Slovenie",
        value: "SI",
      },
      {
        label: "Somalie",
        value: "SO",
      },
      {
        label: "Soudan",
        value: "SD",
      },
      {
        label: "Soudan du sud",
        value: "SS",
      },
      {
        label: "Sri lanka",
        value: "LK",
      },
      {
        label: "Suede",
        value: "SE",
      },
      {
        label: "Suisse",
        value: "CH",
      },
      {
        label: "Suriname",
        value: "SR",
      },
      {
        label: "Syrie",
        value: "SY",
      },
      {
        label: "Tadjikistan",
        value: "TJ",
      },
      {
        label: "Tanzanie",
        value: "TZ",
      },
      {
        label: "Tchad",
        value: "TD",
      },
      {
        label: "Tcheque (republique)",
        value: "CZ",
      },
      {
        label: "Thailande",
        value: "TH",
      },
      {
        label: "Timor oriental",
        value: "TL",
      },
      {
        label: "Togo",
        value: "TG",
      },
      {
        label: "Tonga",
        value: "TO",
      },
      {
        label: "Trinite-et-tobago",
        value: "TT",
      },
      {
        label: "Tunisie",
        value: "TN",
      },
      {
        label: "Turkmenistan",
        value: "TM",
      },
      {
        label: "Turquie",
        value: "TR",
      },
      {
        label: "Tuvalu",
        value: "TV",
      },
      {
        label: "Ukraine",
        value: "UA",
      },
      {
        label: "Uruguay",
        value: "UY",
      },
      {
        label: "Vanuatu",
        value: "VU",
      },
      {
        label: "Vatican, ou saint-siege",
        value: "VA",
      },
      {
        label: "Venezuela",
        value: "VE",
      },
      {
        label: "Viet nam",
        value: "VN",
      },
      {
        label: "Yemen",
        value: "YE",
      },
      {
        label: "Zambie",
        value: "ZM",
      },
      {
        label: "Zimbabwe",
        value: "ZW",
      },
    ],
  },
  "apprenti.telephone": {
    required: true,
    fieldType: "phone",
    label: "Téléphone de l'apprenti(e) :",
    showInfo: true,
  },
  "apprenti.courriel": {
    required: true,
    fieldType: "email",
    label: "Courriel de l'apprenti(e) :",
    requiredMessage: "le courriel de l'apprenti(e) est obligatoire",
    mask: "C",
    maskBlocks: [
      {
        name: "C",
        mask: "Pattern",
        pattern: "^.*$",
      },
    ],
  },
  "apprenti.apprentiMineur": {
    required: true,
    fieldType: "radio",
    label: "À la date de signature de ce contrat, l'apprenti(e) sera-t-il(elle) mineur(e) ?",
    requiredMessage: "l'apprenti(e) sera-t-il(elle) mineur(e) à la date de signature de ce contrat ?",
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
  "apprenti.apprentiMineurNonEmancipe": {
    required: true,
    fieldType: "radio",
    label: "L'apprenti est sous la responsabilité d'un représentant légal (non émancipé)",
    showInfo: true,
    requiredMessage: "Merci de renseigner si l'apprenti(e) mineur(e) est emancipé(e) ou non",
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
  "apprenti.responsableLegal.nom": {
    // required: true,
    _init: ({ values }) => ({ required: shouldAskRepresentantLegal({ values }) }),
    showInfo: true,
    label: "Nom du représentant légal:",
    requiredMessage: "le nom du représentant légal est obligatoire",
    mask: "C",
    maskBlocks: [
      {
        name: "C",
        mask: "Pattern",
        pattern: "^\\D*$",
      },
    ],
  },
  "apprenti.responsableLegal.prenom": {
    _init: ({ values }) => ({ required: shouldAskRepresentantLegal({ values }) }),
    showInfo: true,
    label: "Prénom du représentant légal:",
    requiredMessage: "le prénom du représentant légal est obligatoire",
    mask: "C",
    maskBlocks: [
      {
        name: "C",
        mask: "Pattern",
        pattern: "^\\D*$",
      },
    ],
  },
  "apprenti.responsableLegal.memeAdresse": {
    _init: ({ values }) => ({ required: shouldAskRepresentantLegal({ values }) }),
    showInfo: true,
    label: "l'apprenti(e) vit à la même adresse que son responsable légal",
    requiredMessage: "L'adresse du représentant légal est obligatoire",
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
  "apprenti.responsableLegal.adresse.numero": {
    required: false,
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
  "apprenti.responsableLegal.adresse.repetitionVoie": {
    fieldType: "select",
    label: "Indice de répétition",
    validateMessage: `n'est pas un indice de répétition valide`,
    options: INDICE_DE_REPETITION_OPTIONS,
  },
  "apprenti.responsableLegal.adresse.voie": {
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
  "apprenti.responsableLegal.adresse.complement": {
    required: false,
    label: "Complément d'adresse (optionnel):",
    requiredMessage: "le complement d'adress est obligatoire",
  },
  "apprenti.responsableLegal.adresse.codePostal": {
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
  "apprenti.responsableLegal.adresse.commune": {
    _init: ({ values }) => ({ required: shouldAskResponsalLegalAdresse({ values }) }),
    path: "apprenti.responsableLegal.adresse.commune",
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
  "apprenti.responsableLegal.adresse.pays": {
    _init: ({ values }) => ({ required: shouldAskResponsalLegalAdresse({ values }) }),
    fieldType: "select",
    label: "Pays :",
    requiredMessage: "le pays est obligatoire",
    options: [
      {
        label: "Afghanistan",
        value: "AF",
      },
      {
        label: "Afrique du sud",
        value: "ZA",
      },
      {
        label: "Albanie",
        value: "AL",
      },
      {
        label: "Algerie",
        value: "DZ",
      },
      {
        label: "Allemagne",
        value: "DE",
      },
      {
        label: "Andorre",
        value: "AD",
      },
      {
        label: "Angola",
        value: "AO",
      },
      {
        label: "Antigua-et-barbuda",
        value: "AG",
      },
      {
        label: "Arabie saoudite",
        value: "SA",
      },
      {
        label: "Argentine",
        value: "AR",
      },
      {
        label: "Armenie",
        value: "AM",
      },
      {
        label: "Australie",
        value: "AU",
      },
      {
        label: "Autriche",
        value: "AT",
      },
      {
        label: "Azerbaidjan",
        value: "AZ",
      },
      {
        label: "Bahamas",
        value: "BS",
      },
      {
        label: "Bahrein",
        value: "BH",
      },
      {
        label: "Bangladesh",
        value: "BD",
      },
      {
        label: "Barbade",
        value: "BB",
      },
      {
        label: "Belgique",
        value: "BE",
      },
      {
        label: "Belize",
        value: "BZ",
      },
      {
        label: "Benin",
        value: "BJ",
      },
      {
        label: "Bhoutan",
        value: "BT",
      },
      {
        label: "Bielorussie",
        value: "BY",
      },
      {
        label: "Birmanie",
        value: "MM",
      },
      {
        label: "Bolivie",
        value: "BO",
      },
      {
        label: "Bonaire, saint eustache et saba",
        value: "BQ",
      },
      {
        label: "Bosnie-herzegovine",
        value: "BA",
      },
      {
        label: "Botswana",
        value: "BW",
      },
      {
        label: "Bresil",
        value: "BR",
      },
      {
        label: "Brunei",
        value: "BN",
      },
      {
        label: "Bulgarie",
        value: "BG",
      },
      {
        label: "Burkina",
        value: "BF",
      },
      {
        label: "Burundi",
        value: "BI",
      },
      {
        label: "Cambodge",
        value: "KH",
      },
      {
        label: "Cameroun",
        value: "CM",
      },
      {
        label: "Canada",
        value: "CA",
      },
      {
        label: "Cap-vert",
        value: "CV",
      },
      {
        label: "Centrafricaine (republique)",
        value: "CF",
      },
      {
        label: "Chili",
        value: "CL",
      },
      {
        label: "Chine",
        value: "CN",
      },
      {
        label: "Chypre",
        value: "CY",
      },
      {
        label: "Colombie",
        value: "CO",
      },
      {
        label: "Comores",
        value: "KM",
      },
      {
        label: "Congo",
        value: "CG",
      },
      {
        label: "Congo (republique democratique)",
        value: "CD",
      },
      {
        label: "Coree (republique de)",
        value: "KR",
      },
      {
        label: "Coree (republique populaire democratique de)",
        value: "KP",
      },
      {
        label: "Costa rica",
        value: "CR",
      },
      {
        label: "Cote d'ivoire",
        value: "CI",
      },
      {
        label: "Croatie",
        value: "HR",
      },
      {
        label: "Cuba",
        value: "CU",
      },
      {
        label: "Curaçao",
        value: "CW",
      },
      {
        label: "Danemark",
        value: "DK",
      },
      {
        label: "Djibouti",
        value: "DJ",
      },
      {
        label: "Dominicaine (republique)",
        value: "DO",
      },
      {
        label: "Dominique",
        value: "DM",
      },
      {
        label: "Egypte",
        value: "EG",
      },
      {
        label: "El salvador",
        value: "SV",
      },
      {
        label: "Emirats arabes unis",
        value: "AE",
      },
      {
        label: "Equateur",
        value: "EC",
      },
      {
        label: "Erythree",
        value: "ER",
      },
      {
        label: "Espagne",
        value: "ES",
      },
      {
        label: "Estonie",
        value: "EE",
      },
      {
        label: "Eswatini",
        value: "SZ",
      },
      {
        label: "Etats-unis",
        value: "US",
      },
      {
        label: "Ethiopie",
        value: "ET",
      },
      {
        label: "Ex-republique yougoslave de macedoine",
        value: "MK",
      },
      {
        label: "Fidji",
        value: "FJ",
      },
      {
        label: "Finlande",
        value: "FI",
      },
      {
        label: "France",
        value: "FR",
      },
      {
        label: "Gabon",
        value: "GA",
      },
      {
        label: "Gambie",
        value: "GM",
      },
      {
        label: "Georgie",
        value: "GE",
      },
      {
        label: "Ghana",
        value: "GH",
      },
      {
        label: "Grece",
        value: "GR",
      },
      {
        label: "Grenade",
        value: "GD",
      },
      {
        label: "Guatemala",
        value: "GT",
      },
      {
        label: "Guinee",
        value: "GN",
      },
      {
        label: "Guinee equatoriale",
        value: "GQ",
      },
      {
        label: "Guinee-bissau",
        value: "GW",
      },
      {
        label: "Guyana",
        value: "GY",
      },
      {
        label: "Haiti",
        value: "HT",
      },
      {
        label: "Honduras",
        value: "HN",
      },
      {
        label: "Hongrie",
        value: "HU",
      },
      {
        label: "Inde",
        value: "IN",
      },
      {
        label: "Indonesie",
        value: "ID",
      },
      {
        label: "Iran",
        value: "IR",
      },
      {
        label: "Iraq",
        value: "IQ",
      },
      {
        label: "Irlande, ou eire",
        value: "IE",
      },
      {
        label: "Islande",
        value: "IS",
      },
      {
        label: "Israel",
        value: "IL",
      },
      {
        label: "Italie",
        value: "IT",
      },
      {
        label: "Jamaique",
        value: "JM",
      },
      {
        label: "Japon",
        value: "JP",
      },
      {
        label: "Jordanie",
        value: "JO",
      },
      {
        label: "Kazakhstan",
        value: "KZ",
      },
      {
        label: "Kenya",
        value: "KE",
      },
      {
        label: "Kirghizistan",
        value: "KG",
      },
      {
        label: "Kiribati",
        value: "KI",
      },
      {
        label: "Kosovo",
        value: "XK",
      },
      {
        label: "Koweit",
        value: "KW",
      },
      {
        label: "Laos",
        value: "LA",
      },
      {
        label: "Lesotho",
        value: "LS",
      },
      {
        label: "Lettonie",
        value: "LV",
      },
      {
        label: "Liban",
        value: "LB",
      },
      {
        label: "Liberia",
        value: "LR",
      },
      {
        label: "Libye",
        value: "LY",
      },
      {
        label: "Liechtenstein",
        value: "LI",
      },
      {
        label: "Lituanie",
        value: "LT",
      },
      {
        label: "Luxembourg",
        value: "LU",
      },
      {
        label: "Madagascar",
        value: "MG",
      },
      {
        label: "Malaisie",
        value: "MY",
      },
      {
        label: "Malawi",
        value: "MW",
      },
      {
        label: "Maldives",
        value: "MV",
      },
      {
        label: "Mali",
        value: "ML",
      },
      {
        label: "Malte",
        value: "MT",
      },
      {
        label: "Maroc",
        value: "MA",
      },
      {
        label: "Marshall (iles)",
        value: "MH",
      },
      {
        label: "Maurice",
        value: "MU",
      },
      {
        label: "Mauritanie",
        value: "MR",
      },
      {
        label: "Mexique",
        value: "MX",
      },
      {
        label: "Micronesie (etats federes de)",
        value: "FM",
      },
      {
        label: "Moldavie",
        value: "MD",
      },
      {
        label: "Monaco",
        value: "MC",
      },
      {
        label: "Mongolie",
        value: "MN",
      },
      {
        label: "Montenegro",
        value: "ME",
      },
      {
        label: "Mozambique",
        value: "MZ",
      },
      {
        label: "Namibie",
        value: "NA",
      },
      {
        label: "Nauru",
        value: "NR",
      },
      {
        label: "Nepal",
        value: "NP",
      },
      {
        label: "Nicaragua",
        value: "NI",
      },
      {
        label: "Niger",
        value: "NE",
      },
      {
        label: "Nigeria",
        value: "NG",
      },
      {
        label: "Norvege",
        value: "NO",
      },
      {
        label: "Nouvelle-zelande",
        value: "NZ",
      },
      {
        label: "Oman",
        value: "OM",
      },
      {
        label: "Ouganda",
        value: "UG",
      },
      {
        label: "Ouzbekistan",
        value: "UZ",
      },
      {
        label: "Pakistan",
        value: "PK",
      },
      {
        label: "Palaos (iles)",
        value: "PW",
      },
      {
        label: "Palestine (etat de)",
        value: "PS",
      },
      {
        label: "Panama",
        value: "PA",
      },
      {
        label: "Papouasie-nouvelle-guinee",
        value: "PG",
      },
      {
        label: "Paraguay",
        value: "PY",
      },
      {
        label: "Pays-bas",
        value: "NL",
      },
      {
        label: "Perou",
        value: "PE",
      },
      {
        label: "Philippines",
        value: "PH",
      },
      {
        label: "Pologne",
        value: "PL",
      },
      {
        label: "Portugal",
        value: "PT",
      },
      {
        label: "Qatar",
        value: "QA",
      },
      {
        label: "Roumanie",
        value: "RO",
      },
      {
        label: "Royaume-uni",
        value: "GB",
      },
      {
        label: "Russie",
        value: "RU",
      },
      {
        label: "Rwanda",
        value: "RW",
      },
      {
        label: "Saint-christophe-et-nieves",
        value: "KN",
      },
      {
        label: "Saint-marin",
        value: "SM",
      },
      {
        label: "Saint-martin (partie neerlandaise)",
        value: "SX",
      },
      {
        label: "Saint-vincent-et-les grenadines",
        value: "VC",
      },
      {
        label: "Sainte-lucie",
        value: "LC",
      },
      {
        label: "Salomon (iles)",
        value: "SB",
      },
      {
        label: "Samoa occidentales",
        value: "WS",
      },
      {
        label: "Sao tome-et-principe",
        value: "ST",
      },
      {
        label: "Senegal",
        value: "SN",
      },
      {
        label: "Serbie",
        value: "RS",
      },
      {
        label: "Seychelles",
        value: "SC",
      },
      {
        label: "Sierra leone",
        value: "SL",
      },
      {
        label: "Singapour",
        value: "SG",
      },
      {
        label: "Slovaquie",
        value: "SK",
      },
      {
        label: "Slovenie",
        value: "SI",
      },
      {
        label: "Somalie",
        value: "SO",
      },
      {
        label: "Soudan",
        value: "SD",
      },
      {
        label: "Soudan du sud",
        value: "SS",
      },
      {
        label: "Sri lanka",
        value: "LK",
      },
      {
        label: "Suede",
        value: "SE",
      },
      {
        label: "Suisse",
        value: "CH",
      },
      {
        label: "Suriname",
        value: "SR",
      },
      {
        label: "Syrie",
        value: "SY",
      },
      {
        label: "Tadjikistan",
        value: "TJ",
      },
      {
        label: "Tanzanie",
        value: "TZ",
      },
      {
        label: "Tchad",
        value: "TD",
      },
      {
        label: "Tcheque (republique)",
        value: "CZ",
      },
      {
        label: "Thailande",
        value: "TH",
      },
      {
        label: "Timor oriental",
        value: "TL",
      },
      {
        label: "Togo",
        value: "TG",
      },
      {
        label: "Tonga",
        value: "TO",
      },
      {
        label: "Trinite-et-tobago",
        value: "TT",
      },
      {
        label: "Tunisie",
        value: "TN",
      },
      {
        label: "Turkmenistan",
        value: "TM",
      },
      {
        label: "Turquie",
        value: "TR",
      },
      {
        label: "Tuvalu",
        value: "TV",
      },
      {
        label: "Ukraine",
        value: "UA",
      },
      {
        label: "Uruguay",
        value: "UY",
      },
      {
        label: "Vanuatu",
        value: "VU",
      },
      {
        label: "Vatican, ou saint-siege",
        value: "VA",
      },
      {
        label: "Venezuela",
        value: "VE",
      },
      {
        label: "Viet nam",
        value: "VN",
      },
      {
        label: "Yemen",
        value: "YE",
      },
      {
        label: "Zambie",
        value: "ZM",
      },
      {
        label: "Zimbabwe",
        value: "ZW",
      },
    ],
  },
  "apprenti.dateNaissance": {
    fieldType: "date",
    required: true,
    label: "Date de naissance :",
    requiredMessage: "La date de naissance de l'apprenti(e) est obligatoire",
    showInfo: true,
  },
  "apprenti.sexe": {
    required: true,
    fieldType: "radio",
    label: "Sexe :",
    requiredMessage: "le sexe de l'apprenti(e) est obligatoire",
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
  "apprenti.departementNaissance": {
    required: true,
    label: "Département de naissance :",
    requiredMessage: "le département de naissance est obligatoire",
    validateMessage: " n'est pas un département valide",
    showInfo: true,
  },
  "apprenti.communeNaissance": {
    required: true,
    label: "Commune de naissance :",
    requiredMessage: "la commune de naissance est obligatoire",
    mask: "C",
    maskBlocks: [
      {
        name: "C",
        mask: "Pattern",
        pattern: "^.*$",
      },
    ],
  },
  "apprenti.nationalite": {
    required: true,
    fieldType: "select",
    label: "Nationalité :",
    requiredMessage: "la nationalité de l'apprenti(e) est obligatoire",
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
  "apprenti.regimeSocial": {
    fieldType: "select",
    required: true,
    label: "Régime social :",
    requiredMessage: "le régime social de l'apprenti(e) est obligatoire",
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
  "apprenti.inscriptionSportifDeHautNiveau": {
    fieldType: "radio",
    required: true,
    label: "Déclare être inscrit sur la liste des sportifs, entraîneurs, arbitres et juges sportifs de haut niveau :",
    requiredMessage: "Cette déclaration est obligatoire",
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
  "apprenti.handicap": {
    fieldType: "radio",
    required: true,
    label: "Déclare bénéficier de la reconnaissance travailleur handicapé :",
    requiredMessage: "La déclaration de reconnaissance travailleur handicapé est obligatoire",
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
  "apprenti.situationAvantContrat": {
    fieldType: "select",
    required: true,
    label: "Situation avant ce contrat :",
    requiredMessage: "la situation de l'apprenti(e) avant ce contrat est obligatoire",
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
  "apprenti.diplomePrepare": {
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
    label: "Dernier diplôme ou titre préparé :",
    requiredMessage: "le dernier diplôme ou titre préparé par l'apprenti(e) est obligatoire",
  },
  "apprenti.derniereClasse": {
    fieldType: "select",
    required: true,
    label: "Dernière classe / année suivie :",
    requiredMessage: "la dernière classe / année suivie par l'apprenti(e) est obligatoire",
    showInfo: true,
    options: [
      {
        label: "01: l'apprenti a suivi la dernière année du cycle de formation et a obtenu le diplôme ou titre",
        value: 1,
      },
      {
        label:
          "11: l'apprenti a suivi la 1ère année du cycle et l'a validée (examens réussis mais année non diplômante)",
        value: 11,
      },
      {
        label:
          "12: l'apprenti a suivi la 1ère année du cycle mais ne l'a pas validée (échec aux examens, interruption ou abandon de formation)",
        value: 12,
      },
      {
        label: "21: l'apprenti a suivi la 2è année du cycle et l'a validée (examens réussis mais année non diplômante)",
        value: 21,
      },
      {
        label:
          "22: l'apprenti a suivi la 2è année du cycle mais ne l'a pas validée (échec aux examens, interruption ou abandon de formation)",
        value: 22,
      },
      {
        label:
          "31: l'apprenti a suivi la 3è année du cycle et l'a validée (examens réussis mais année non diplômante, cycle adaptés)",
        value: 31,
      },
      {
        label:
          "32: l'apprenti a suivi la 3è année du cycle mais ne l'a pas validée (échec aux examens, interruption ou abandon de formation)",
        value: 32,
      },
      {
        label: "40: l'apprenti a achevé le 1er cycle de l'enseignement secondaire (collège)",
        value: 40,
      },
      {
        label: "41: l'apprenti a interrompu ses études en classe de 3è",
        value: 41,
      },
      {
        label: "42: l'apprenti a interrompu ses études en classe de 4è",
        value: 42,
      },
    ],
  },
  "apprenti.intituleDiplomePrepare": {
    required: true,
    showInfo: true,
    label: "Intitulé précis du dernier diplôme ou titre préparé :",
    requiredMessage: "l'intitulé du dernier diplôme ou titre préparé par l'apprenti(e) est obligatoire",
  },
  "apprenti.diplome": {
    fieldType: "select",
    required: true,
    showInfo: true,
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
    label: "Diplôme ou titre le plus élevé obtenu :",
    requiredMessage: "le diplôme ou titre le plus élevé obtenu par l'apprenti(e) est obligatoire",
  },
  "apprenti.age": { fieldType: "number" },
};
