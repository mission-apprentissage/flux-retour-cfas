import { z } from "zod";

import { REQUIRED_KEYS, ALL_KEYS } from "../constants/upload";

const mappingFields = Object.keys(ALL_KEYS).reduce(
  (acc, key) => ({
    ...acc,
    [key]: REQUIRED_KEYS[key] ? z.string() : z.string().optional(),
  }),
  {}
) as Record<keyof typeof ALL_KEYS, z.ZodString>;

const uploadMappingSchema = () =>
  z.object({
    typeCodeDiplome: z.enum(["RNCP", "CFD"]),
    annee_scolaire: z.string(),
    // allow any key in the proposed mapping
    ...mappingFields,
  });

export default uploadMappingSchema;
