"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Field, Form, Formik } from "formik";
import NextLink from "next/link";
import React from "react";
import { useLocalStorage } from "usehooks-ts";

import { getApiErrorMessage, isRateLimited } from "@/common/rateLimit";

import styles from "./Connexion.module.scss";
import { type AuthConnexionValues, submitLogin, validateAuthConnexion } from "./login.schema";

export function StandardLoginForm() {
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
      initialValues={{ email: "", password: "" }}
      validate={validateAuthConnexion}
      onSubmit={handleSubmit}
    >
      {({ status = {} }) => (
        <Form noValidate>
          <div className={styles.form}>
            <Field name="email">
              {({ field, meta }: any) => (
                <Input
                  label="Email (votre identifiant)"
                  state={meta.touched && meta.error ? "error" : "default"}
                  stateRelatedMessage={meta.touched ? (meta.error ?? " ") : " "}
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
                  stateRelatedMessage={meta.touched ? (meta.error ?? " ") : " "}
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
                    <Button
                      type="button"
                      priority="tertiary no outline"
                      iconId={show ? "ri-eye-off-line" : "ri-eye-line"}
                      title={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                      onClick={() => setShow((s) => !s)}
                    />
                  }
                />
              )}
            </Field>

            <div className={styles.actions}>
              <Button type="submit">Connexion</Button>
              <NextLink href="/auth/mot-de-passe-oublie" className={fr.cx("fr-link")}>
                Mot de passe oublié
              </NextLink>
            </div>

            {status.error && (
              <div className={styles.alert}>
                <Alert severity={status.severity ?? "error"} small description={status.error} />
              </div>
            )}
          </div>
        </Form>
      )}
    </Formik>
  );
}
