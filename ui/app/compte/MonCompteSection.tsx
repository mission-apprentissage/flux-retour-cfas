"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { Field, Form, Formik, FormikErrors, FormikHelpers } from "formik";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z, ZodError } from "zod";

import { _put } from "@/common/httpClient";

import { TrackFormDirty } from "../_components/UnsavedChangesContext";
import { useAuth } from "../_context/UserContext";

const profilSchema = z.object({
  civility: z.enum(["Monsieur", "Madame"]).optional(),
  prenom: z.string().trim().min(1, "Champ obligatoire"),
  nom: z.string().trim().min(1, "Champ obligatoire"),
  telephone: z.string().trim().optional(),
});

type ProfilForm = z.infer<typeof profilSchema>;

type FormAlert = { severity: "success" | "error"; message: string };

export function MonCompteSection() {
  const { user } = useAuth();
  const router = useRouter();
  const [alert, setAlert] = useState<FormAlert | null>(null);

  const handleSubmit = async (values: ProfilForm, { setSubmitting, resetForm }: FormikHelpers<ProfilForm>) => {
    setAlert(null);
    try {
      await _put("/api/v1/profile/user", {
        civility: values.civility,
        prenom: values.prenom.trim(),
        nom: values.nom.trim(),
        telephone: values.telephone?.trim() || undefined,
      });
      // Remet le formulaire à l'état "non modifié" tout de suite (dirty=false) pour ne pas redéclencher le garde.
      resetForm({ values });
      // Le user est injecté côté serveur (getSession) dans le layout : on rafraîchit pour répercuter la modif.
      router.refresh();
      setAlert({ severity: "success", message: "Vos informations ont été enregistrées." });
    } catch (err: any) {
      const message = err?.json?.data?.message || err?.message || "Erreur lors de l'enregistrement";
      setAlert({ severity: "error", message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="fr-h3" style={{ color: "var(--text-title-blue-france)" }}>
        Mes informations
      </h1>
      <p className="fr-text--sm fr-mb-3w" style={{ color: "var(--text-mention-grey)" }}>
        Vos informations personnelles relatives à votre compte Tableau de bord de l&apos;apprentissage
      </p>

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

      <Formik<ProfilForm>
        initialValues={{
          civility: user?.civility,
          prenom: user?.prenom ?? "",
          nom: user?.nom ?? "",
          telephone: user?.telephone ?? "",
        }}
        enableReinitialize
        validate={(values) => {
          try {
            profilSchema.parse(values);
            return {};
          } catch (err) {
            const errors: FormikErrors<ProfilForm> = {};
            if (err instanceof ZodError) {
              err.errors.forEach((issue) => {
                const key = issue.path[0] as keyof ProfilForm;
                if (key) errors[key] = issue.message;
              });
            }
            return errors;
          }
        }}
        onSubmit={handleSubmit}
      >
        {({ values, isSubmitting, dirty, isValid, handleChange }) => (
          <Form noValidate style={{ maxWidth: 720 }}>
            <TrackFormDirty dirty={dirty} />
            <RadioButtons
              legend="Civilité"
              name="civility"
              orientation="horizontal"
              options={[
                {
                  label: "Madame",
                  nativeInputProps: { value: "Madame", checked: values.civility === "Madame", onChange: handleChange },
                },
                {
                  label: "Monsieur",
                  nativeInputProps: {
                    value: "Monsieur",
                    checked: values.civility === "Monsieur",
                    onChange: handleChange,
                  },
                },
              ]}
            />

            <Field name="prenom">
              {({ field, meta }: any) => (
                <Input
                  label="Prénom"
                  state={meta.touched && meta.error ? "error" : "default"}
                  stateRelatedMessage={meta.touched && meta.error ? meta.error : undefined}
                  nativeInputProps={{ ...field }}
                />
              )}
            </Field>

            <Field name="nom">
              {({ field, meta }: any) => (
                <Input
                  label="Nom"
                  state={meta.touched && meta.error ? "error" : "default"}
                  stateRelatedMessage={meta.touched && meta.error ? meta.error : undefined}
                  nativeInputProps={{ ...field }}
                />
              )}
            </Field>

            <Field name="telephone">
              {({ field }: any) => <Input label="Numéro de téléphone" nativeInputProps={{ ...field, type: "tel" }} />}
            </Field>

            <Input
              label="Adresse courriel"
              hintText="Cette adresse ne peut pas être modifiée."
              nativeInputProps={{ value: user?.email ?? "", disabled: true, readOnly: true }}
            />

            <Button type="submit" disabled={isSubmitting || !dirty || !isValid} style={{ marginTop: fr.spacing("2w") }}>
              Enregistrer les modifications
            </Button>
          </Form>
        )}
      </Formik>
    </div>
  );
}
