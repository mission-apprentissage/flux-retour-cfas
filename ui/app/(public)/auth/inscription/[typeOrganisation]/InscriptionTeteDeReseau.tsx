"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Select } from "@codegouvfr/react-dsfr/SelectNext";
import { useQuery } from "@tanstack/react-query";
import { Field, Form, Formik } from "formik";
import { useRouter } from "next/navigation";
import type { IReseau } from "shared";

import { PAGES } from "@/app/_utils/routes.utils";
import { _get, _post } from "@/common/httpClient";
import { getApiErrorMessage } from "@/common/rateLimit";

import styles from "./inscription-organisation.module.scss";
import type { InscriptionFormProps } from "./types";

const AUTRE_RESEAU = "AUTRE";

type ReseauFormValues = { nomReseau: string; email: string };

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function InscriptionTeteDeReseau({
  organisation,
  setOrganisation,
  setHideBackNextButtons,
}: InscriptionFormProps & { setHideBackNextButtons: (hidden: boolean) => void }) {
  const router = useRouter();
  const { data: reseaux } = useQuery<IReseau[]>(["tete_de_reseaux"], () => _get("/api/v1/reseaux"));

  const options = reseaux ? [...reseaux, { nom: "Autre Réseau", key: AUTRE_RESEAU } as IReseau] : [];

  const isAutreReseau = organisation?.type === "TETE_DE_RESEAU" && (organisation?.reseau as string) === AUTRE_RESEAU;

  const submitUnknownNetwork = async (values: ReseauFormValues, { setStatus }: any) => {
    try {
      await _post("/api/v1/auth/register-unknown-network", {
        email: values.email,
        unknownNetwork: values.nomReseau,
      });
      router.push(PAGES.static.authInscriptionReseauAutre.getPath());
    } catch (err: any) {
      setStatus({ error: getApiErrorMessage(err) });
    }
  };

  return (
    <>
      <Select
        label={
          <>
            Vous représentez le réseau : <span className={styles.requiredMark}>*</span>
          </>
        }
        placeholder="Sélectionner votre réseau"
        nativeSelectProps={{
          onChange: (event) => {
            const reseau = event.target.value;
            setOrganisation(reseau ? { type: "TETE_DE_RESEAU", reseau } : null);
            setHideBackNextButtons(reseau === AUTRE_RESEAU);
          },
        }}
        options={options.map((reseau) => ({ value: reseau.key, label: reseau.nom }))}
      />

      {isAutreReseau && (
        <Formik<ReseauFormValues>
          initialValues={{ nomReseau: "", email: "" }}
          validate={(values) => {
            const errors: Partial<ReseauFormValues> = {};
            if (!values.nomReseau) errors.nomReseau = "Veuillez saisir un nom de réseau";
            if (!values.email) errors.email = "Veuillez saisir un identifiant";
            else if (!EMAIL_REGEX.test(values.email)) errors.email = "Veuillez saisir un email valide";
            return errors;
          }}
          onSubmit={submitUnknownNetwork}
        >
          {({ status = {}, isSubmitting }) => (
            <Form noValidate>
              <Field name="nomReseau">
                {({ field, meta }: any) => (
                  <Input
                    label={
                      <>
                        Indiquez le nom de votre réseau : <span className={styles.requiredMark}>*</span>
                      </>
                    }
                    state={meta.touched && meta.error ? "error" : "default"}
                    stateRelatedMessage={meta.touched ? meta.error : undefined}
                    nativeInputProps={{
                      id: field.name,
                      name: field.name,
                      value: field.value,
                      placeholder: "Nom du réseau...",
                      onChange: field.onChange,
                      onBlur: field.onBlur,
                    }}
                  />
                )}
              </Field>

              <Field name="email">
                {({ field, meta }: any) => (
                  <Input
                    label={
                      <>
                        Votre courriel : <span className={styles.requiredMark}>*</span>
                      </>
                    }
                    state={meta.touched && meta.error ? "error" : "default"}
                    stateRelatedMessage={meta.touched ? meta.error : undefined}
                    nativeInputProps={{
                      id: field.name,
                      name: field.name,
                      type: "email",
                      value: field.value,
                      placeholder: "prenom.nom@courriel.fr",
                      onChange: field.onChange,
                      onBlur: field.onBlur,
                    }}
                  />
                )}
              </Field>

              {status.error && <Alert severity="error" small description={status.error} />}

              <div className={styles.actions}>
                <Button
                  type="button"
                  priority="secondary"
                  onClick={() => router.push(PAGES.dynamic.authInscription().getPath())}
                >
                  Revenir
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  Suivant
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      )}
    </>
  );
}
