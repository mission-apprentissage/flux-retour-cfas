import Joi from "joi";
import { integer, object, objectId, string, boolean, arrayOf, date } from "../json-schema/jsonSchemaTypes.js";
import { schemaValidation } from "../../utils/schemaUtils.js";
import { siretSchema, passwordSchema, uaiSchema } from "../../utils/validationUtils.js";
import { RESEAUX_CFAS } from "../../constants/networksConstants.js";
import { REGIONS, ACADEMIES, DEPARTEMENTS } from "../../constants/territoiresConstants.js";
import { ORGANISMES_APPARTENANCE, USER_ACCOUNT_STATUS } from "../../constants/usersConstants.js";

export const collectionName = "usersMigration";

export function indexes() {
  return [[{ email: 1 }, { unique: true }], [{ "emails.token": 1 }]];
}

export const schema = object(
  {
    _id: objectId(),
    email: string({ description: "Email utilisateur" }),
    password: string({ description: "Le mot de passe hashé" }),
    civility: string({ description: "civilité", enum: ["Madame", "Monsieur"] }),
    nom: string({ description: "Le nom de l'utilisateur" }),
    prenom: string({ description: "Le prénom de l'utilisateur" }),
    telephone: string({ description: "Le téléphone de l'utilisateur" }),
    description: string({ description: "Description de l'utilisateur" }),
    siret: string({ description: "N° SIRET", pattern: "^[0-9]{14}$", maxLength: 14, minLength: 14 }),
    uai: string({
      description: "Code uai de l'organisme (seulement pour les utilisateurs OF)",
      pattern: "^[0-9]{7}[a-zA-Z]$",
      maxLength: 8,
      minLength: 8,
    }),
    organisation: string({
      description: "Appartenance à une organisation (exemple DREETS, MISSION_LOCALE..)",
      enum: Object.keys(ORGANISMES_APPARTENANCE),
    }),
    main_organisme_id: objectId({
      description: "Organisme principe id",
    }),

    // Scoping
    reseau: string({
      description: "Si l'utilisateur est scopé à un réseau, le quel ?",
      enum: Object.keys(RESEAUX_CFAS),
    }),
    erp: string({ description: "Si l'utilisateur est scopé à un erp, le quel ?" }),
    codes_region: arrayOf(
      string({
        enum: REGIONS.map(({ code }) => code),
      }),
      { description: "Si l'utilisateur est scopé à une ou des région(s), lesquelles ?" }
    ),
    codes_academie: arrayOf(
      string({
        enum: Object.values(ACADEMIES).map(({ code }) => `${code}`),
      }),
      { description: "Si l'utilisateur est scopé à une ou des académie(s), lesquelles ?" }
    ),
    codes_departement: arrayOf(
      string({
        example: "1 Ain, 99 Étranger",
        pattern: "^([0-9][0-9]|2[AB]|9[012345]|97[1234678]|98[46789])$",
        enum: DEPARTEMENTS.map(({ code }) => code),
        maxLength: 3,
        minLength: 1,
      }),
      { description: "Si l'utilisateur est scopé à un ou des département(s), lesquels ?" }
    ),
    is_cross_organismes: boolean({ description: "true si l'utilisateur est transverse à tous les organismes" }),

    // Internal
    account_status: string({
      description: "Statut du compte",
      enum: Object.keys(USER_ACCOUNT_STATUS),
    }),
    has_accept_cgu_version: string({ description: "Version des cgu accepté par l'utilisateur" }),
    orign_register: string({ description: "Origine de l'inscription", enum: ["ORIGIN"] }),
    is_admin: boolean({ description: "true si l'utilisateur est administrateur" }),
    roles: arrayOf(objectId(), { description: "Roles de l'utilisateur" }),
    custom_acl: arrayOf(string(), { description: "Custom Access control level array" }),
    created_at: date({ description: "Date de création du compte" }),
    last_connection: date({ description: "Date de dernière connexion" }),
    connection_history: arrayOf(date(), { description: "Historique des dates de connexion" }),
    invalided_token: boolean({ description: "true si besoin de reset le token" }),
    password_updated_at: date({ description: "Date de dernière mise à jour mot de passe" }),
    emails: arrayOf(
      object(
        {
          token: string(),
          templateName: string(),
          // payload: object(),
          sendDates: arrayOf(date()),
          openDate: date(),
          messageIds: arrayOf(string()),
          error: arrayOf(
            object({
              type: string({
                enum: ["fatal", "soft_bounce", "hard_bounce", "complaint", "invalid_email", "blocked", "error"],
              }),
              message: string(),
            })
          ),
        },
        { required: ["token", "templateName", "sendDates"], additionalProperties: true }
      )
    ),
    unsubscribe: boolean({ description: "unsubscribe email" }),
    tour_guide: boolean({ description: "true si le tour guide est actif" }),
    v: integer(),
  },
  { required: ["email"], additionalProperties: true }
);

// Default value
export function defaultValuesUser() {
  return {
    account_status: "NOT_CONFIRMED",
    orign_register: "ORIGIN",
    has_accept_cgu_version: "",
    is_cross_organismes: false,
    is_admin: false,
    roles: [],
    codes_region: [],
    codes_academie: [],
    codes_departement: [],
    custom_acl: [],
    tour_guide: true,
    invalided_token: false,
    password_updated_at: new Date(),
    connection_history: [],
    emails: [],
    created_at: new Date(),
  };
}

// Extra validation
export function validateUser(props) {
  const { codes_region, codes_academie, codes_departement, reseau, erp } = props;

  // Check if only one settled
  const scopeTerritoire = [codes_region?.length, codes_academie?.length, codes_departement?.length];
  if (scopeTerritoire.length - scopeTerritoire.filter((v) => !!v).length < 2) {
    throw new Error(`schema not valid : codes_region, codes_academie, codes_departement ONLY ONE OF THEM CAN BE SET`);
  }

  if (reseau && erp) {
    throw new Error(`schema not valid : reseau, erp ONLY ONE OF THEM CAN BE SET`);
  }

  return schemaValidation({
    entity: props,
    schema,
    extensions: [
      {
        name: "email",
        base: Joi.string().email(),
      },
      {
        name: "password",
        base: passwordSchema(),
      },
      {
        name: "siret",
        base: siretSchema(),
      },
      {
        name: "uai",
        base: uaiSchema(),
      },
    ],
  });
}
