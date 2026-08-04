"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Field, Form, Formik, FormikErrors } from "formik";
import { useRouter, useSearchParams } from "next/navigation";
import { ReactNode, useState } from "react";
import { z, ZodError } from "zod";

import { _post } from "@/common/httpClient";
import { getApiErrorMessage, isRateLimited } from "@/common/rateLimit";

import styles from "./reset-password.module.scss";

const REDIRECT_TIMEOUT = 2500;

const getPasswordMinLength = (role: string | null | undefined) => (role === "ADMINISTRATEUR" ? 20 : 12);

type ResetPasswordValues = { newPassword: string };

type Rule = { id: string; label: ReactNode; isSatisfied: (password: string) => boolean; message: string };

const getRules = (minLength: number): Rule[] => [
  {
    id: "min",
    label: (
      <>
        au moins <strong>{minLength} caractères</strong>
      </>
    ),
    isSatisfied: (password) => password.length >= minLength,
    message: `Le mot de passe doit contenir au moins ${minLength} caractères`,
  },
  {
    id: "lowerCase",
    label: (
      <>
        au moins <strong>une lettre minuscule</strong>
      </>
    ),
    isSatisfied: (password) => /[a-z]/.test(password),
    message: "Le mot de passe doit contenir au moins une lettre minuscule",
  },
  {
    id: "upperCase",
    label: (
      <>
        au moins <strong>une lettre majuscule</strong>
      </>
    ),
    isSatisfied: (password) => /[A-Z]/.test(password),
    message: "Le mot de passe doit contenir au moins une lettre majuscule",
  },
  {
    id: "special",
    label: (
      <>
        au moins <strong>un caractère spécial</strong>
      </>
    ),
    isSatisfied: (password) => /[^\w\d\s:]/.test(password),
    message: "Le mot de passe doit contenir au moins un caractère spécial",
  },
  {
    id: "number",
    label: (
      <>
        au moins <strong>un chiffre</strong>
      </>
    ),
    isSatisfied: (password) => /[0-9]/.test(password),
    message: "Le mot de passe doit contenir au moins un chiffre",
  },
];

const getSchema = (rules: Rule[]) =>
  z.object({
    newPassword: rules.reduce(
      (schema, rule) => schema.refine((password) => rule.isSatisfied(password.trim()), { message: rule.message }),
      z.string().nonempty({ message: "Veuillez saisir un mot de passe" }) as z.ZodType<string>
    ),
  });

export default function ResetPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const passwordToken = searchParams?.get("passwordToken");
  const minLength = getPasswordMinLength(searchParams?.get("role"));

  const [showPassword, setShowPassword] = useState(false);
  const [hasTyped, setHasTyped] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const rules = getRules(minLength);
  const schema = getSchema(rules);

  const validate = (values: ResetPasswordValues) => {
    try {
      schema.parse(values);
      return {};
    } catch (err) {
      const errors: FormikErrors<ResetPasswordValues> = {};
      if (err instanceof ZodError) {
        err.errors.forEach((issue) => {
          const key = issue.path[0] as keyof ResetPasswordValues;
          if (key && !errors[key]) errors[key] = issue.message;
        });
      }
      return errors;
    }
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
            {({ values, status = {}, isSubmitting }) => (
              <Form noValidate>
                <Field name="newPassword">
                  {({ field, meta }: any) => (
                    <Input
                      label="Nouveau mot de passe"
                      state={meta.touched && meta.error ? "error" : "default"}
                      nativeInputProps={{
                        id: field.name,
                        name: field.name,
                        type: showPassword ? "text" : "password",
                        autoComplete: "new-password",
                        placeholder: "Votre mot de passe...",
                        value: field.value,
                        onChange: (event) => {
                          setHasTyped(true);
                          field.onChange(event);
                        },
                        onBlur: field.onBlur,
                      }}
                      action={
                        <Button
                          type="button"
                          priority="tertiary no outline"
                          iconId={showPassword ? "ri-eye-off-line" : "ri-eye-line"}
                          title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                          onClick={() => setShowPassword((shown) => !shown)}
                        />
                      }
                    />
                  )}
                </Field>

                <div className={`${fr.cx("fr-messages-group")} ${styles.rules}`} aria-live="polite">
                  <p className={fr.cx("fr-message")}>Votre mot de passe doit contenir :</p>
                  {rules.map((rule) => (
                    <p
                      key={rule.id}
                      className={fr.cx(
                        "fr-message",
                        !hasTyped
                          ? "fr-message--info"
                          : rule.isSatisfied(values.newPassword.trim())
                            ? "fr-message--valid"
                            : "fr-message--error"
                      )}
                    >
                      <span>{rule.label}</span>
                    </p>
                  ))}
                </div>

                <Button type="submit" disabled={isSubmitting} style={{ width: "100%", justifyContent: "center" }}>
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
