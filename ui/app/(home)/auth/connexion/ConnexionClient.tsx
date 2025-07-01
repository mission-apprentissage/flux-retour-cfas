"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Container, Stack, Link, Typography, IconButton } from "@mui/material";
import { Formik, Form, Field, FormikErrors } from "formik";
import NextLink from "next/link";
import React from "react";
import { useLocalStorage } from "usehooks-ts";
import { z, ZodError } from "zod";

import { _post } from "@/common/httpClient";
import { AlertRounded, ShowPassword } from "@/theme/components/icons";

const authConnexionSchema = z.object({
  email: z.string().email({ message: "Format d'email invalide" }),
  password: z.string().nonempty({ message: "Requis" }),
});
type AuthConnexionType = z.infer<typeof authConnexionSchema>;

export default function ConnexionClient() {
  const [originConnexionUrl, setOriginConnexionUrl] = useLocalStorage("originConnexionUrl", "");
  const [show, setShow] = React.useState(false);

  const handleTogglePassword = () => setShow((s) => !s);

  const login = async (values: AuthConnexionType, { setStatus }: any) => {
    try {
      await _post("/api/v1/auth/login", values);
      if (originConnexionUrl) {
        setOriginConnexionUrl("");
        window.location.href = originConnexionUrl;
      } else {
        window.location.href = "/";
      }
    } catch (err: any) {
      const errorMessage = err?.json?.data?.message || err.message;
      setStatus({ error: errorMessage });
    }
  };

  return (
    <Container
      maxWidth="sm"
      sx={{
        display: "flex",
        flexDirection: "column",
        border: "1px solid",
        borderColor: fr.colors.decisions.border.default.grey.default,
        py: { xs: fr.spacing("6w") },
        px: { xs: fr.spacing("6w") },
        mx: "auto",
        my: { xs: fr.spacing("2w"), md: fr.spacing("4w") },
      }}
    >
      <Typography component="h1" variant="h3" sx={{ mb: fr.spacing("3w") }}>
        Connectez-vous
      </Typography>

      <Formik<AuthConnexionType>
        initialValues={{ email: "", password: "" }}
        validate={(values) => {
          try {
            authConnexionSchema.parse(values);
            return {};
          } catch (err) {
            const errors: FormikErrors<AuthConnexionType> = {};
            if (err instanceof ZodError) {
              err.errors.forEach((issue) => {
                const key = issue.path[0] as keyof AuthConnexionType;
                if (key) {
                  errors[key] = issue.message;
                }
              });
            }
            return errors;
          }
        }}
        onSubmit={login}
      >
        {({ status = {} }) => (
          <Form noValidate>
            <Stack>
              <Field name="email">
                {({ field, meta }: any) => (
                  <Input
                    label="Email (votre identifiant)"
                    state={meta.touched && meta.error ? "error" : "default"}
                    stateRelatedMessage={meta.touched ? (meta.error ?? "\u00a0") : "\u00a0"}
                    nativeInputProps={{
                      id: field.name,
                      name: field.name,
                      type: "email",
                      placeholder: "prenom.nom@courriel.fr",
                      value: field.value,
                      onChange: field.onChange,
                      onBlur: field.onBlur,
                    }}
                  />
                )}
              </Field>

              <Field name="password">
                {({ field, meta }: any) => (
                  <Input
                    label="Mot de passe"
                    state={meta.touched && meta.error ? "error" : "default"}
                    stateRelatedMessage={meta.touched ? (meta.error ?? "\u00a0") : "\u00a0"}
                    nativeInputProps={{
                      id: field.name,
                      name: field.name,
                      type: show ? "text" : "password",
                      placeholder: "************************",
                      value: field.value,
                      onChange: field.onChange,
                      onBlur: field.onBlur,
                    }}
                    action={
                      <IconButton
                        type="button"
                        onClick={handleTogglePassword}
                        aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                      >
                        <ShowPassword />
                      </IconButton>
                    }
                  />
                )}
              </Field>

              <Stack direction="row" spacing={fr.spacing("4w")} alignItems="center" sx={{ mt: fr.spacing("2w") }}>
                <Button type="submit">Connexion</Button>
                <Link component={NextLink} href="/auth/mot-de-passe-oublie">
                  Mot de passe oublié
                </Link>
              </Stack>

              {status.error && (
                <Typography color="error" sx={{ display: "flex", alignItems: "center", mt: fr.spacing("4w") }}>
                  <AlertRounded sx={{ mr: fr.spacing("1w") }} /> {status.error}
                </Typography>
              )}
            </Stack>
          </Form>
        )}
      </Formik>

      <Stack direction="row" spacing={fr.spacing("1w")} justifyContent="center" sx={{ mt: fr.spacing("8w") }}>
        <Typography>Vous n&apos;avez pas encore de compte ?</Typography>
        <Link component={NextLink} href="/auth/inscription">
          Créer un compte
        </Link>
      </Stack>
    </Container>
  );
}
