"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Formik, Form, Field, FormikErrors } from "formik";
import { useRouter } from "next/navigation";
import React from "react";
import { z, ZodError } from "zod";

import { PAGES } from "@/app/_utils/routes.utils";
import { _post } from "@/common/httpClient";
import { getApiErrorMessage, isRateLimited } from "@/common/rateLimit";

import { AuthCard } from "../_components/AuthCard";

import styles from "./forgot-password.module.scss";

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Format d'email invalide" }),
});
type ForgotPasswordType = z.infer<typeof forgotPasswordSchema>;

const REDIRECT_TIMEOUT = 5000;

export default function ForgotPasswordClient() {
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
      setStatus({ error: getApiErrorMessage(err), severity: isRateLimited(err) ? "warning" : "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="Mot de passe oublié"
      footer={
        <p className={styles.footer}>
          <a className={fr.cx("fr-link")} href={PAGES.static.authConnexion.getPath()}>
            Annuler
          </a>
        </p>
      }
    >
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
            <Field name="email">
              {({ field, meta }: any) => (
                <Input
                  label="Email (votre identifiant)"
                  state={meta.touched && meta.error ? "error" : "default"}
                  stateRelatedMessage={meta.touched ? meta.error : undefined}
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

            {statusMessage && (
              <div className={styles.alert}>
                <Alert severity="success" small description={statusMessage} />
              </div>
            )}

            <Button type="submit" disabled={isSubmitting} className={styles.submit}>
              Recevoir un courriel de ré-initialisation
            </Button>

            {status.error && (
              <div className={styles.alert}>
                <Alert severity={status.severity ?? "error"} small description={status.error} />
              </div>
            )}
          </Form>
        )}
      </Formik>
    </AuthCard>
  );
}
