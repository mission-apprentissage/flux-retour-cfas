"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Field, Form, Formik, FormikErrors } from "formik";
import { useState } from "react";
import { z, ZodError } from "zod";

import { useMlParametres, useUpdateMlParametres } from "@/app/_components/ruptures/shared/hooks";

const URL_ERROR = "Veuillez saisir une URL publique valide (ex: https://www.exemple.fr/rdv)";

const parametresSchema = z.object({
  rdv_url: z
    .string()
    .trim()
    .max(2000)
    .refine(
      (s) => {
        try {
          const url = new URL(s);
          if (!["http:", "https:"].includes(url.protocol)) return false;
          // Doit avoir un domaine type "host.tld" (pas localhost, pas une IP)
          const parts = url.hostname.split(".");
          if (parts.length < 2) return false;
          const tld = parts[parts.length - 1];
          // TLD = au moins 2 lettres ASCII (rejette ".1" d'une IP, ".a", etc.)
          return /^[a-z]{2,}$/i.test(tld);
        } catch {
          return false;
        }
      },
      { message: URL_ERROR }
    )
    .or(z.literal("")),
});

type ParametresForm = z.infer<typeof parametresSchema>;

type FormAlert = { severity: "success" | "error"; message: string };

export default function ParametresClient() {
  const { data, isLoading } = useMlParametres();
  const { mutateAsync: updateParametres } = useUpdateMlParametres();
  const [alert, setAlert] = useState<FormAlert | null>(null);

  if (isLoading) {
    return null;
  }

  const handleSubmit = async (values: ParametresForm, { setSubmitting }: { setSubmitting: (v: boolean) => void }) => {
    setAlert(null);
    const trimmed = values.rdv_url.trim();
    try {
      await updateParametres({ rdv_url: trimmed === "" ? null : trimmed });
      setAlert({ severity: "success", message: "Vos paramètres ont été enregistrés." });
    } catch (err: any) {
      const errorMessage = err?.json?.data?.message || err?.message || "Erreur lors de l'enregistrement";
      setAlert({ severity: "error", message: errorMessage });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fr-container">
      <h1 className="fr-h3 fr-mb-3w fr-mt-3w" style={{ color: "var(--background-flat-blue-cumulus)" }}>
        Paramètres de votre Mission Locale
      </h1>

      {alert && (
        <Alert
          severity={alert.severity}
          description={alert.message}
          closable
          onClose={() => setAlert(null)}
          className="fr-mb-2w"
          small
        />
      )}

      <Formik<ParametresForm>
        initialValues={{ rdv_url: data?.rdv_url ?? "" }}
        enableReinitialize
        validate={(values) => {
          try {
            parametresSchema.parse(values);
            return {};
          } catch (err) {
            const errors: FormikErrors<ParametresForm> = {};
            if (err instanceof ZodError) {
              err.errors.forEach((issue) => {
                const key = issue.path[0] as keyof ParametresForm;
                if (key) errors[key] = issue.message;
              });
            }
            return errors;
          }
        }}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, dirty, isValid }) => (
          <Form noValidate style={{ maxWidth: 720 }}>
            <Field name="rdv_url">
              {({ field, meta }: any) => (
                <Input
                  label="Lien de prise de rendez-vous"
                  hintText="Ce lien sera envoyé aux jeunes qui répondent positivement à notre message WhatsApp pour qu'ils puissent prendre RDV directement avec votre Mission Locale."
                  state={meta.touched && meta.error ? "error" : "default"}
                  stateRelatedMessage={meta.touched ? (meta.error ?? " ") : " "}
                  nativeInputProps={{
                    id: field.name,
                    name: field.name,
                    type: "url",
                    placeholder: "https://www.ma-mission-locale.fr/prise-de-rdv",
                    value: field.value,
                    onChange: field.onChange,
                    onBlur: field.onBlur,
                  }}
                />
              )}
            </Field>

            <Button type="submit" disabled={isSubmitting || !dirty || !isValid} style={{ marginTop: fr.spacing("2w") }}>
              Enregistrer
            </Button>
          </Form>
        )}
      </Formik>
    </div>
  );
}
