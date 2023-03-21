import { date, object, objectId, string } from "./json-schema/jsonSchemaTypes.js";
import { RESEAUX_CFAS } from "../constants/networksConstants.js";
import { NATURE_ORGANISME_DE_FORMATION } from "../utils/validationsUtils/organisme-de-formation/nature.js";
import { REGIONS, DEPARTEMENTS, ACADEMIES } from "../constants/territoiresConstants.js";
import { ORGANISMES_APPARTENANCE } from "../constants/usersConstants.js";

const collectionName = "organisations";

// FIXME compléter si besoin d'indexes
const indexes = () => {
  return [];
};

const schema = object(
  {
    _id: objectId(),

    type: string({
      description: "Type d'organisation (exemple DREETS, OF, etc)",
      enum: Object.keys(ORGANISMES_APPARTENANCE),
    }),

    // si OFRF, OFR, OFF
    siret: string({ description: "N° SIRET", pattern: "^[0-9]{14}$", maxLength: 14, minLength: 14 }),
    uai: string({
      description: "Code UAI de l'organisme (seulement pour les utilisateurs OF)",
      pattern: "^[0-9]{7}[a-zA-Z]$",
      maxLength: 8,
      minLength: 8,
    }),
    nature: string({
      description: "Nature de l'organisme de formation",
      enum: Object.values(NATURE_ORGANISME_DE_FORMATION),
    }),

    // si tête de réseau
    reseau: string({ enum: Object.keys(RESEAUX_CFAS), description: "Nom du réseau" }),

    // si DREETS, DEETS, DRAAF, CONSEIL_REGIONAL
    code_region: string({
      enum: REGIONS.map(({ code }) => code),
      description: "Code région",
    }),

    // si DDETS
    code_departement: string({
      example: "1 Ain, 99 Étranger",
      pattern: "^([0-9][0-9]|2[AB]|9[012345]|97[1234678]|98[46789])$",
      enum: DEPARTEMENTS.map(({ code }) => code),
      maxLength: 3,
      minLength: 1,
      description: "Code département",
    }),

    // si académie
    code_academie: string({
      enum: Object.values(ACADEMIES).map(({ code }) => `${code}`),
      description: "Code académie",
    }),

    created_at: date({ description: "Date de création en base de données" }),
  },
  { required: ["type"], additionalProperties: true }
);

export default { schema, indexes, collectionName };
