"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Field, Form, Formik } from "formik";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { _post } from "@/common/httpClient";
import { getApiErrorMessage, isRateLimited } from "@/common/rateLimit";

import { PasswordField } from "../_components/PasswordField";
import { ADMIN_PASSWORD_MIN_LENGTH, DEFAULT_PASSWORD_MIN_LENGTH, getPasswordError } from "../_components/passwordRules";

import styles from "./reset-password.module.scss";

const REDIRECT_TIMEOUT = 2500;

const getPasswordMinLength = (role: string | null | undefined) =>
  role === "ADMINISTRATEUR" ? ADMIN_PASSWORD_MIN_LENGTH : DEFAULT_PASSWORD_MIN_LENGTH;

type ResetPasswordValues = { newPassword: string };

export default function ResetPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const passwordToken = searchParams?.get("passwordToken");
  const minLength = getPasswordMinLength(searchParams?.get("role"));

  const [isDone, setIsDone] = useState(false);

  const validate = ({ newPassword }: ResetPasswordValues) => {
    const error = getPasswordError(newPassword, minLength);
    return error ? { newPassword: error } : {};
  };

  const handleSubmit = async ({ newPassword }: ResetPasswordValues, { setStatus, setSubmitting }: any) => {
    try {
      await _post("/api/v1/password/reset-password", { passwordToken, password: newPassword.trim() });
      setIsDone(true);
      setTimeout(() => router.push("/auth/connexion"), REDIRECT_TIMEOUT);
    } catch (err: any) {
      if (isRateLimited(err)) {
        setStatus({ error: getApiErrorMessage(err), severity: "warning" });
        return;
      }
      setStatus({
        error: (
          <span>
            Le lien est expiré ou invalide, merci de prendre contact avec un administrateur en précisant votre adresse
            mail :{" "}
            <a className={fr.cx("fr-link")} href="mailto:tableau-de-bord@apprentissage.beta.gouv.fr">
              tableau-de-bord@apprentissage.beta.gouv.fr
            </a>
          </span>
        ),
        severity: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h1 className={styles.title}>Veuillez saisir un nouveau mot de passe</h1>

        {isDone ? (
          <Alert
            severity="success"
            small
            description="Votre mot de passe a bien été changé. Vous pouvez désormais vous connecter."
          />
        ) : (
          <Formik<ResetPasswordValues> initialValues={{ newPassword: "" }} validate={validate} onSubmit={handleSubmit}>
            {({ status = {}, isSubmitting }) => (
              <Form noValidate>
                <Field name="newPassword">
                  {({ field, meta }: any) => (
                    <PasswordField
                      label="Nouveau mot de passe"
                      id={field.name}
                      name={field.name}
                      value={field.value}
                      placeholder="Votre mot de passe..."
                      minLength={minLength}
                      hasError={Boolean(meta.touched && meta.error)}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                    />
                  )}
                </Field>

                <Button type="submit" disabled={isSubmitting} className={styles.submit}>
                  Réinitialiser le mot de passe
                </Button>

                {status.error && (
                  <div className={styles.alert}>
                    <Alert severity={status.severity ?? "error"} small description={status.error} />
                  </div>
                )}
              </Form>
            )}
          </Formik>
        )}
      </div>
    </div>
  );
}
