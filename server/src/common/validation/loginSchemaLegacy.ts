import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

const loginSchemaLegacy = z.object({
  username: z.string().openapi({
    description: "Le username pour s'authentifier",
    example: "jean.dupont",
  }),
  password: z.string().openapi({
    description: "Le mot de passe pour s'authentifier",
    example: "monMOtDePAsseSecur1sE",
  }),
});

export default loginSchemaLegacy;
