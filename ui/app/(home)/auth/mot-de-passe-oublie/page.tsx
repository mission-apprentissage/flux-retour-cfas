"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Container, Stack, Link, Typography } from "@mui/material";
import { Formik, Form, Field, FormikErrors } from "formik";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { z, ZodError } from "zod";

import { _post } from "@/common/httpClient";
import { AlertRounded } from "@/theme/components/icons";

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Format d'email invalide" }),
});
type ForgotPasswordType = z.infer<typeof forgotPasswordSchema>;

const REDIRECT_TIMEOUT = 5000;

export default function ForgotPassword() {
  const router = useRouter();
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);

  const handleSubmit = async (values: ForgotPasswordType, { setStatus, setSubmitting }: any) => {
    try {
      await _post("/api/v1/password/forgotten-password", { ...values });
      setStatusMessage(
        "Si cette adresse existe, vous allez recevoir un e-mail contenant un lien pour réinitialiser votre mot de passe."
      );
      setTimeout(() => router.push("/"), REDIRECT_TIMEOUT);
    } catch (err: any) {
      const errorMessage = err?.json?.data?.message || err.message;
      setStatus({ error: errorMessage });
    } finally {
      setSubmitting(false);
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
        Mot de passe oublié
      </Typography>

      <Formik<ForgotPasswordType>
        initialValues={{ email: "" }}
        validate={(values) => {
          try {
            forgotPasswordSchema.parse(values);
            return {};
          } catch (err) {
            const errors: FormikErrors<ForgotPasswordType> = {};
            if (err instanceof ZodError) {
              err.errors.forEach((issue) => {
                const key = issue.path[0] as keyof ForgotPasswordType;
                if (key) errors[key] = issue.message;
              });
            }
            return errors;
          }
        }}
        onSubmit={handleSubmit}
      >
        {({ status = {}, isSubmitting }) => (
          <Form noValidate>
            <Stack sx={{ gap: fr.spacing("1w") }}>
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

              {statusMessage && <Typography color="primary">{statusMessage}</Typography>}

              <Button type="submit" disabled={isSubmitting} style={{ width: "100%", justifyContent: "center" }}>
                Recevoir un courriel de ré-initialisation
              </Button>

              {status.error && (
                <Typography color="error" sx={{ display: "flex", alignItems: "center" }}>
                  <AlertRounded sx={{ mr: fr.spacing("1w") }} /> {status.error}
                </Typography>
              )}
            </Stack>
          </Form>
        )}
      </Formik>

      <Stack direction="row" spacing={fr.spacing("1w")} justifyContent="center" sx={{ mt: fr.spacing("5w") }}>
        <Link component={NextLink} href="/auth/connexion">
          Annuler
        </Link>
      </Stack>
    </Container>
  );
}
