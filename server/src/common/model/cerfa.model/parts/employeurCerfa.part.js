import { object, string, integer } from "../../json-schema/jsonSchemaTypes.js";
import { adresseSchema, defaultValuesAdresse } from "../../json-schema/adresseSchema.js";
// const idccEnum = require("./idcc.part");
// import departementEnum from "./departements.part.js";

export const employeurCerfaSchema = object({
  denomination: string({
    path: "employeur.denomination",
    description: "La dénomination sociale doit être celle de l'établissement dans lequel le contrat s'exécute.",
    example: "Mairie",
    // required: function () {
    //   return !this.draft;
    // },
  }),
  raison_sociale: string({
    path: "employeur.raison_sociale",
    description: "Raison sociale de l'employeur",
    example: "OCTO-TECHNOLOGY",
  }),
  siret: string({
    path: "employeur.siret",
    description: `Vous devez renseigner le siret correspondant à l'établissement du lieu d'exécution du contrat (il ne correspond pas forcément au siège). Le siret comporte 14 chiffres. Il doit être présent et actif dans la base Entreprises de l'INSEE (regroupant employeurs privés et publics).`,
    example: "98765432400019",
    pattern: "^[0-9]{14}$",
    maxLength: 14,
    minLength: 14,
    //validate
    // nullable: function () {
    //   return this.draft;
    // },
    // required: function () {
    //   return !this.draft;
    // },
  }),
  naf: string({
    path: "employeur.naf",
    description:
      "Le Code NAF est composé de 4 chiffres et 1 lettre. Il est délivré par l'INSEE.[Informations sur le Code NAF.](https://www.economie.gouv.fr/entreprises/activite-entreprise-code-ape-code-naf)",
    example: "1031Z",
    pattern: "^([0-9]){2}\\.?([0-9]){0,2}([a-zA-Z]){0,1}$",
    maxLength: 6,
    // required: function () {
    //   return !this.draft;
    // },
  }),
  nombreDeSalaries: integer({
    path: "employeur.nombreDeSalaries",
    description:
      "L'effectif salarié rempli automatiquement correspond à l'estimation de la base Entreprises de l'INSEE. <br/>L'effectif renseigné est celui de l’entreprise dans sa globalité (et non seulement l’effectif de l’établissement d’exécution du contrat).",
    example: 123,
    // required: function () {
    //   return !this.draft;
    // },
  }),
  codeIdcc: string({
    path: "employeur.codeIdcc",
    description: `Identifiant de la convention collective de branche appliquée par l’établissement.  \n\n Recherchez votre code convention collective sur : [le site du Ministère du travail.](https://www.elections-professionnelles.travail.gouv.fr/web/guest/recherche-idcc)`,
    example: "9999",
    pattern: "^[0-9]{4}$",
    maxLength: 4,
    // enum: [null, ...idccEnum.map(({ code }) => code)],
    // required: function () {
    //   return !this.draft;
    // },
  }),
  libelleIdcc: string({
    path: "employeur.libelleIdcc",
    description: "Libellé de la convention collective appliquée",
    example:
      "Convention collective nationale des entreprises de commission, de courtage et de commerce intracommunautaire et d'importation-exportation de France métropolitaine",
    maxLength: 500,
    // enum: [null, ...idccEnum.map(({ libelle }) => libelle)],
    // nullable
    // required: function () {
    //   return !this.draft;
    // },
  }),
  telephone: string({
    path: "employeur.telephone",
    description: `Dans le cas d'un numéro français, il n'est pas 
      nécessaire de saisir le "0" car l'indicateur pays est 
      pré-renseigné.
      Il doit contenir 9 chiffres après l'indicatif.`,
    example: "+33908070605",
    pattern: "^([+])?(\\d{7,12})$",
    maxLength: 13,
    minLength: 8,
    // validate
    // required: function () {
    //   return !this.draft;
    // },
  }),
  courriel: string({
    path: "employeur.courriel",
    description: `Ce courriel sera utilisé pour l'envoi des notifications pour le suivi du dossier.
      Il doit être au format courriel@texte.domaine.`,
    example: "energie3000.pro@gmail.com",
    pattern: '^(([^<>()[]\\.,;:s@"]+(.[^<>()[]\\.,;:s@"]+)*)|(".+"))@[*[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+]*$',
    maxLength: 80,
    // validate
    // required: function () {
    //   return !this.draft;
    // },
  }),
  adresse: {
    ...adresseSchema,
    properties: {
      ...adresseSchema.properties,
      numero: {
        path: "employeur.adresse.numero",
        ...adresseSchema.properties.numero,
      },
      voie: {
        path: "employeur.adresse.voie",
        ...adresseSchema.properties.voie,
      },
      complement: {
        path: "employeur.adresse.complement",
        ...adresseSchema.properties.complement,
        example: "Hôtel de ville ; Entrée ; Bâtiment ; Etage ; Service ; BP",
      },
      code_postal: {
        path: "employeur.adresse.code_postal",
        ...adresseSchema.properties.code_postal,
      },
      code_insee: {
        path: "employeur.adresse.code_insee",
        ...adresseSchema.properties.code_insee,
      },
      commune: {
        path: "employeur.adresse.commune",
        ...adresseSchema.properties.commune,
      },
      // departement: {
      //   path: "employeur.adresse.departement",
      //   enum: [null, ...departementEnum.map((d) => d.replace(/^(0){1}/, ""))],
      //   maxLength: 3,
      //   minLength: 1,
      //   validate: {
      //     validator: function (v) {
      //       if (!v) return true;
      //       return /^([0-9][0-9]|2[AB]|9[012345]|97[1234678]|98[46789])$/.test(v);
      //     },
      //     message: (props) => `${props.value} n'est pas un departement valide`,
      //   },
      //   type: String,
      //   description: "Département de l'employeur",
      //   example: "1 Ain, 99 Étranger",
      //   pattern: "^([0-9][0-9]|2[AB]|9[012345]|97[1234678]|98[46789])$",
      //   default: null,
      //   nullable: true,
      //   required: function () {
      //     return !this.draft;
      //   },
      // },
      // region: {
      //   path: "employeur.adresse.region",
      //   type: Number,
      //   description: "Région de l'employeur",
      //   example: "93 Provence-Alpes-Côte d'Azur",
      //   default: null,
      //   nullable: true,
      //   required: function () {
      //     return !this.draft;
      //   },
      // },
    },
  },
  nom: string({
    path: "employeur.nom",
    description: "Nom de l'employeur",
    example: "LEFEVBRE",
    maxLength: 200,
  }),
  prenom: string({
    path: "employeur.prenom",
    description: "Prénom de l'employeur",
    example: "MARTINE",
    maxLength: 50,
  }),
  typeEmployeur: integer({
    path: "employeur.typeEmployeur",
    description: "Le type d'employeur doit être en adéquation avec son statut juridique.",
    example: 11,
    enum: [11, 12, 13, 14, 15, 16, 21, 22, 23, 24, 25, 26, 27, 28, 29],
    // required: function () {
    //   return !this.draft;
    // },
  }),
  employeurSpecifique: integer({
    path: "employeur.employeurSpecifique",
    description:
      "**Employeur spécifique** : \r\n<br />1 : Entreprise de travail temporaire\r\n<br />2 : Groupement d’employeurs\r\n<br />3 : Employeur saisonnier\r\n<br />4 : Apprentissage familial : l’employeur est un ascendant de l’apprenti\r\n<br />0 : Aucun de ces cas",
    enum: [0, 1, 2, 3, 4],
  }),
});
// caisseComplementaire
// regimeSpecifique
// attestationEligibilite
// attestationPieces
// privePublic

// Default value
export function defaultValuesEmployeurCerfa() {
  return {
    denomination: null,
    raison_sociale: null,
    siret: null,
    naf: null,
    nombreDeSalaries: null,
    codeIdcc: null,
    libelleIdcc: null,
    telephone: null,
    courriel: null,
    adresse: defaultValuesAdresse(),
    nom: null,
    prenom: null,
    typeEmployeur: null,
    employeurSpecifique: 0,
  };
}
