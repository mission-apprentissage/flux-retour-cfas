import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
extendZodWithOpenApi(z);

const loginSchema = z.object({
  username: z.string().openapi({
    description: "Le username pour s'authentifier",
    example: "jean.dupont",
  }),
  password: z.string().openapi({
    description: "Le mot de passe pour s'authentifier",
    example: "monMOtDePAsseSecur1sE",
  }),
});

export default loginSchema;
