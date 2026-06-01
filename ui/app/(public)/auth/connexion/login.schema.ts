import { z, ZodError } from "zod";

import { _post } from "@/common/httpClient";

export const authConnexionSchema = z.object({
  email: z.string().email({ message: "Format d'email invalide" }),
  password: z.string().nonempty({ message: "Requis" }),
});

export type AuthConnexionValues = z.infer<typeof authConnexionSchema>;

export const validateAuthConnexion = (values: AuthConnexionValues) => {
  try {
    authConnexionSchema.parse(values);
    return {};
  } catch (err) {
    const errors: Partial<Record<keyof AuthConnexionValues, string>> = {};
    if (err instanceof ZodError) {
      err.errors.forEach((issue) => {
        const key = issue.path[0] as keyof AuthConnexionValues;
        if (key) errors[key] = issue.message;
      });
    }
    return errors;
  }
};

/**
 * Navigue vers `originConnexionUrl` si mémorisé (l'utilisateur a été redirigé
 * vers la connexion depuis une page protégée), sinon vers `/`.
 */
export const submitLogin = async (
  values: AuthConnexionValues,
  options: { originConnexionUrl: string | undefined; clearOriginConnexionUrl: () => void }
): Promise<void> => {
  await _post("/api/v1/auth/login", values);
  if (options.originConnexionUrl) {
    options.clearOriginConnexionUrl();
    window.location.href = options.originConnexionUrl;
    return;
  }
  window.location.href = "/";
};
