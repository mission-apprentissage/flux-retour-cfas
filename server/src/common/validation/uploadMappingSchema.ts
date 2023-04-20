import { z } from "zod";

import { REQUIRED_KEYS, OPTIONAL_KEYS } from "../constants/upload";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { CFD, RNCP, ...otherRequiredFields } = REQUIRED_KEYS;

const optionalFields = Object.keys(OPTIONAL_KEYS).reduce(
  (acc, key) => ({
    ...acc,
    [key]: z.string().optional(),
  }),
  {}
) as Record<keyof typeof OPTIONAL_KEYS, z.ZodString>;

const requiredFields = Object.keys(otherRequiredFields).reduce(
  (acc, key) => ({
    ...acc,
    [key]: z.string(),
  }),
  {}
) as Record<keyof typeof otherRequiredFields, z.ZodString>;

const switchKeyValue = (obj: Record<string, string>) =>
  Object.entries(obj).reduce((acc, [key, value]) => ({ ...acc, [value]: key }), {});

const switchMappingValue = ({ annee_scolaire, typeCodeDiplome, ...v }: any) => ({
  annee_scolaire,
  typeCodeDiplome,
  ...switchKeyValue(v),
});

// Note: le process actuel envoie un mapping ou les clés sont les colonnes fournies par l'utilisateur
// et les valeurs sont les champs du model TDB.
// Du coup, on inverse les clés et les valeurs pour vérifier que les champs du model TDB sont bien
// présents dans le mapping.
// Et on refait le mapping inverse avant de passer à l'API.
//
// TODO: changer le process pour envoyer un mapping où les clés sont les champs du model TDB
// et les valeurs sont les colonnes fournies par l'utilisateur. Ca permettra d'avoir un typing plus précis.
//
const uploadMappingSchema = () =>
  z.preprocess(
    switchMappingValue,
    z
      .discriminatedUnion("typeCodeDiplome", [
        z.object({
          typeCodeDiplome: z.literal("RNCP"),
          RNCP: z.string(),
          ...requiredFields,
          ...optionalFields,
        }),
        z.object({
          typeCodeDiplome: z.literal("CFD"),
          CFD: z.string(),
          ...requiredFields,
          ...optionalFields,
        }),
      ])
      .transform(switchMappingValue)
  );

export default uploadMappingSchema;
