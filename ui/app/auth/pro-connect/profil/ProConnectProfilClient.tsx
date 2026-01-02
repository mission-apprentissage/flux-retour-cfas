"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { useFormik } from "formik";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { IOrganisationJson } from "shared";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";

import { useAuth } from "@/app/_context/UserContext";
import { _post } from "@/common/httpClient";
import { CGU_VERSION } from "@/components/legal/Cgu";

const profilSchema = z.object({
  civility: z.string().min(1, "Votre civilité est obligatoire"),
  nom: z.string().min(1, "Votre nom est obligatoire"),
  prenom: z.string().min(1, "Votre prénom est obligatoire"),
  fonction: z.string().min(1, "Votre fonction est obligatoire"),
  telephone: z.string().optional(),
  has_accepted_cgu: z.boolean().refine((val) => val === true, {
    message: "Vous devez cocher cette case",
  }),
  consent_of: z.boolean().refine((val) => val === true, {
    message: "Vous devez cocher cette case",
  }),
});

export default function ProConnectProfilClient() {
  const { user } = useAuth();
  const router = useRouter();
  const [alert, setAlert] = useState<{
    message: string;
    severity: "success" | "error" | "warning" | "info";
    description?: string;
  } | null>(null);

  const organisation = user?.organisation as IOrganisationJson | undefined;
  const isMissionLocale = organisation?.type === "MISSION_LOCALE";

  // Get organisation name based on type
  const getOrganisationName = () => {
    if (!organisation) return "";
    if (organisation.type === "MISSION_LOCALE") {
      return organisation.nom;
    }
    return "";
  };

  const { values, errors, touched, handleSubmit, handleChange, isSubmitting } = useFormik({
    validationSchema: toFormikValidationSchema(profilSchema),
    initialValues: {
      civility: "",
      nom: "",
      prenom: "",
      fonction: "",
      telephone: "",
      has_accepted_cgu: false,
      consent_of: false,
    },
    onSubmit: async (formValues) => {
      try {
        const { account_status } = await _post("/api/v1/auth/proconnect/register", {
          civility: formValues.civility,
          nom: formValues.nom,
          prenom: formValues.prenom,
          fonction: formValues.fonction,
          telephone: formValues.telephone,
          has_accept_cgu_version: CGU_VERSION,
        });

        if (account_status === "CONFIRMED") {
          setAlert({
            message: "Votre compte a été créé. Vous pouvez désormais accéder à votre espace.",
            severity: "success",
          });
          // Redirection vers l'espace mission locale
          setTimeout(() => {
            router.push("/mission-locale");
          }, 2000);
        } else {
          setAlert({
            message: "Votre compte a été créé avec succès.",
            severity: "success",
          });
        }
      } catch (err: any) {
        const errorMessage: string = err?.json?.data?.message || err.message;
        setAlert({
          message: "Une erreur est survenue",
          severity: "error",
          description: errorMessage || "Merci de réessayer plus tard.",
        });
      }
    },
  });

  if (!organisation) {
    return (
      <div className="fr-container fr-my-6w">
        <Alert
          severity="warning"
          title="Organisation introuvable"
          description="Impossible de charger les informations de votre organisation."
        />
      </div>
    );
  }

  return (
    <div className="fr-container fr-my-6w">
      <div className="fr-grid-row fr-grid-row--center">
        <div className="fr-col-12 fr-col-md-8 fr-col-lg-6">
          <h1 className="fr-h1">Compléter votre profil</h1>

          {/* Organisation Ribbon */}
          <div className="fr-callout fr-mb-3w">
            <h3 className="fr-callout__title">Mission Locale {getOrganisationName()}</h3>
          </div>

          {alert && (
            <Alert
              severity={alert.severity}
              title={alert.message}
              description={alert.description}
              closable
              onClose={() => setAlert(null)}
              className="fr-mb-3w"
            />
          )}

          <form onSubmit={handleSubmit}>
            <Input
              label="Votre courriel"
              nativeInputProps={{
                type: "email",
                id: "email",
                name: "email",
                value: user?.email || "",
                disabled: true,
              }}
              disabled
              className="fr-mb-3w"
            />

            <RadioButtons
              legend="Civilité"
              name="civility"
              orientation="horizontal"
              options={[
                {
                  label: "Monsieur",
                  nativeInputProps: {
                    value: "Monsieur",
                    checked: values.civility === "Monsieur",
                    onChange: handleChange,
                  },
                },
                {
                  label: "Madame",
                  nativeInputProps: {
                    value: "Madame",
                    checked: values.civility === "Madame",
                    onChange: handleChange,
                  },
                },
              ]}
              state={errors.civility && touched.civility ? "error" : "default"}
              stateRelatedMessage={errors.civility && touched.civility ? (errors.civility as string) : undefined}
            />

            <Input
              label="Votre nom"
              nativeInputProps={{
                type: "text",
                id: "nom",
                name: "nom",
                value: values.nom,
                onChange: handleChange,
                placeholder: "Ex : Dupont",
              }}
              state={errors.nom && touched.nom ? "error" : "default"}
              stateRelatedMessage={errors.nom && touched.nom ? (errors.nom as string) : undefined}
              className="fr-mt-3w"
            />

            <Input
              label="Votre prénom"
              nativeInputProps={{
                type: "text",
                id: "prenom",
                name: "prenom",
                value: values.prenom,
                onChange: handleChange,
                placeholder: "Ex : Jean",
              }}
              state={errors.prenom && touched.prenom ? "error" : "default"}
              stateRelatedMessage={errors.prenom && touched.prenom ? (errors.prenom as string) : undefined}
              className="fr-mt-3w"
            />

            <Input
              label="Votre fonction au sein de l'établissement"
              nativeInputProps={{
                type: "text",
                id: "fonction",
                name: "fonction",
                value: values.fonction,
                onChange: handleChange,
                placeholder: "Ex : Conseiller",
              }}
              state={errors.fonction && touched.fonction ? "error" : "default"}
              stateRelatedMessage={errors.fonction && touched.fonction ? (errors.fonction as string) : undefined}
              className="fr-mt-3w"
            />

            <Input
              label="Téléphone"
              nativeInputProps={{
                type: "tel",
                id: "telephone",
                name: "telephone",
                value: values.telephone,
                onChange: handleChange,
                placeholder: "Ex : 06 89 10 11 12",
              }}
              state={errors.telephone && touched.telephone ? "error" : "default"}
              stateRelatedMessage={errors.telephone && touched.telephone ? (errors.telephone as string) : undefined}
              className="fr-mt-3w"
            />

            <Checkbox
              className="fr-mt-3w"
              options={[
                {
                  label: (
                    <>
                      J&apos;atteste avoir lu et accepté les{" "}
                      <a href="/cgu" target="_blank" rel="noreferrer">
                        conditions générales d&apos;utilisation
                      </a>
                    </>
                  ),
                  nativeInputProps: {
                    name: "has_accepted_cgu",
                    checked: values.has_accepted_cgu,
                    onChange: (e) => handleChange({ target: { name: "has_accepted_cgu", value: e.target.checked } }),
                  },
                },
              ]}
              state={errors.has_accepted_cgu && touched.has_accepted_cgu ? "error" : "default"}
              stateRelatedMessage={
                errors.has_accepted_cgu && touched.has_accepted_cgu ? (errors.has_accepted_cgu as string) : undefined
              }
            />

            {isMissionLocale && (
              <Checkbox
                className="fr-mt-3w"
                options={[
                  {
                    label:
                      "J'accepte d'être contacté par un opérateur public (DREETS, Académie, …) ou un CFA de mon territoire. Mon email apparaîtra dans le profil de mon organisme.",
                    nativeInputProps: {
                      name: "consent_of",
                      checked: values.consent_of,
                      onChange: (e) => handleChange({ target: { name: "consent_of", value: e.target.checked } }),
                    },
                  },
                ]}
                state={errors.consent_of && touched.consent_of ? "error" : "default"}
                stateRelatedMessage={
                  errors.consent_of && touched.consent_of ? (errors.consent_of as string) : undefined
                }
              />
            )}

            <div className="fr-btns-group fr-mt-3w">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Création du compte..." : "Créer mon compte"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
