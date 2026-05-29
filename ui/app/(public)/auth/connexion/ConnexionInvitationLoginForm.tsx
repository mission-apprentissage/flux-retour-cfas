"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { IconButton, Link, Stack } from "@mui/material";
import { Field, Form, Formik } from "formik";
import NextLink from "next/link";
import React from "react";
import { useLocalStorage } from "usehooks-ts";

import { OrganismeCard, type ConnexionInvitationInfo } from "@/app/_components/onboarding";
import { getApiErrorMessage, isRateLimited } from "@/common/rateLimit";
import { ShowPassword } from "@/theme/components/icons";

import { type AuthConnexionValues, submitLogin, validateAuthConnexion } from "./login.schema";

type ConnexionInvitationLoginFormProps = {
  invitation: ConnexionInvitationInfo;
};

export function ConnexionInvitationLoginForm({ invitation }: ConnexionInvitationLoginFormProps) {
  const [originConnexionUrl, setOriginConnexionUrl] = useLocalStorage("originConnexionUrl", "");
  const [show, setShow] = React.useState(false);

  const handleSubmit = async (values: AuthConnexionValues, { setStatus }: any) => {
    try {
      await submitLogin(values, {
        originConnexionUrl,
        clearOriginConnexionUrl: () => setOriginConnexionUrl(""),
      });
    } catch (err: any) {
      setStatus({ error: getApiErrorMessage(err), severity: isRateLimited(err) ? "warning" : "error" });
    }
  };

  return (
    <Formik<AuthConnexionValues>
      initialValues={{ email: invitation.email, password: "" }}
      enableReinitialize
      validate={validateAuthConnexion}
      onSubmit={handleSubmit}
    >
      {({ status = {} }) => (
        <Form noValidate>
          <Stack>
            <Field name="email">
              {({ field, meta }: any) => (
                <Input
                  label="Adresse courriel (Votre identifiant)"
                  state={meta.touched && meta.error ? "error" : "default"}
                  stateRelatedMessage={meta.touched ? (meta.error ?? " ") : " "}
                  disabled
                  nativeInputProps={{
                    id: field.name,
                    name: field.name,
                    type: "email",
                    placeholder: "prenom.nom@courriel.fr",
                    value: field.value,
                    onChange: field.onChange,
                    onBlur: field.onBlur,
                    readOnly: true,
                  }}
                />
              )}
            </Field>

            {invitation.organisme && (
              <OrganismeCard
                nom={invitation.organisme.nom}
                adresse={invitation.organisme.adresse}
                uai={invitation.organisme.uai}
                siret={invitation.organisme.siret}
              />
            )}

            <Field name="password">
              {({ field, meta }: any) => (
                <Input
                  label="Votre mot de passe"
                  state={meta.touched && meta.error ? "error" : "default"}
                  stateRelatedMessage={meta.touched ? (meta.error ?? " ") : " "}
                  nativeInputProps={{
                    id: field.name,
                    name: field.name,
                    type: show ? "text" : "password",
                    placeholder: "************************",
                    value: field.value,
                    onChange: field.onChange,
                    onBlur: field.onBlur,
                    autoFocus: true,
                  }}
                  action={
                    <IconButton
                      type="button"
                      onClick={() => setShow((s) => !s)}
                      aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    >
                      <ShowPassword />
                    </IconButton>
                  }
                />
              )}
            </Field>

            <Stack direction="column" alignItems="center" spacing={fr.spacing("2w")} sx={{ mt: fr.spacing("2w") }}>
              <Button type="submit" iconId="ri-arrow-right-line" iconPosition="right">
                Me connecter
              </Button>
              <Link component={NextLink} href="/auth/mot-de-passe-oublie">
                Mot de passe oublié ?
              </Link>
            </Stack>

            {status.error && (
              <Stack sx={{ mt: fr.spacing("4w") }}>
                <Alert severity={status.severity ?? "error"} small description={status.error} />
              </Stack>
            )}
          </Stack>
        </Form>
      )}
    </Formik>
  );
}
