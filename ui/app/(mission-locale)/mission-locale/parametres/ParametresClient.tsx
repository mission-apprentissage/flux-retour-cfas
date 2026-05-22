"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Field, Form, Formik, FormikErrors } from "formik";
import { z, ZodError } from "zod";

import { useMlParametres, useUpdateMlParametres } from "@/app/_components/ruptures/shared/hooks";
import useToaster from "@/hooks/useToaster";

const parametresSchema = z.object({
  rdv_url: z
    .string()
    .url("Format d'URL invalide")
    .max(2000)
    .refine(
      (s) => {
        try {
          return ["http:", "https:"].includes(new URL(s).protocol);
        } catch {
          return false;
        }
      },
      { message: "L'URL doit commencer par http:// ou https://" }
    )
    .or(z.literal("")),
});

type ParametresForm = z.infer<typeof parametresSchema>;

export default function ParametresClient() {
  const { data, isLoading } = useMlParametres();
  const { mutateAsync: updateParametres } = useUpdateMlParametres();
  const { toastSuccess, toastError } = useToaster();

  if (isLoading) {
    return null;
  }

  const handleSubmit = async (values: ParametresForm, { setSubmitting }: { setSubmitting: (v: boolean) => void }) => {
    try {
      await updateParametres({ rdv_url: values.rdv_url === "" ? null : values.rdv_url });
      toastSuccess("Vos paramètres ont été enregistrés.");
    } catch (err: any) {
      const errorMessage = err?.json?.data?.message || err?.message || "Erreur lors de l'enregistrement";
      toastError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fr-container">
      <h1 className="fr-h3 fr-mb-3w fr-mt-3w" style={{ color: "var(--background-flat-blue-cumulus)" }}>
        Paramètres de votre Mission Locale
      </h1>

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
