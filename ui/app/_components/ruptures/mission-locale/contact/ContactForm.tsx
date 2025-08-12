"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { Formik, Form } from "formik";
import { SITUATION_ENUM } from "shared";

import {
  BaseFormProps,
  useRecordContact,
  createContactSuccessPayload,
  createContactFailurePayload,
} from "../../shared";

import styles from "./ContactForm.module.css";

interface ContactFormProps extends BaseFormProps {}

interface FormValues {
  contactSuccess: boolean | null;
  situation: SITUATION_ENUM | null;
  situationAutre: string;
  commentaires: string;
  probleme: string;
  action: "garder" | "traiter" | null;
}

const initialValues: FormValues = {
  contactSuccess: null,
  situation: null,
  situationAutre: "",
  commentaires: "",
  probleme: "",
  action: null,
};

const validate = (values: FormValues) => {
  const errors: any = {};

  if (values.contactSuccess === null) {
    errors.contactSuccess = "Veuillez indiquer si vous avez pu rentrer en contact avec le jeune";
    return errors;
  }

  if (values.contactSuccess) {
    if (!values.situation) {
      errors.situation = "Veuillez sélectionner un retour sur ce dossier";
    }
    if (values.situation === SITUATION_ENUM.AUTRE && !values.situationAutre.trim()) {
      errors.situationAutre = "Veuillez préciser la situation";
    }
  } else {
    if (!values.probleme.trim()) {
      errors.probleme = "Veuillez préciser le problème rencontré";
    }
    if (!values.action) {
      errors.action = "Veuillez choisir une action";
    }
  }

  return errors;
};

export function ContactForm({ effectifId, onSuccess }: ContactFormProps) {
  const recordContactMutation = useRecordContact();

  const handleSubmit = async (values: FormValues) => {
    try {
      const payload = values.contactSuccess
        ? createContactSuccessPayload(values.situation!, values.situationAutre, values.commentaires)
        : createContactFailurePayload(values.probleme, values.action!);

      await recordContactMutation.mutateAsync({ effectifId, payload });
      onSuccess();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className={styles.container}>
      <h3 className={`fr-mb-2w ${styles.title}`}>Que se passe-t-il aujourd&apos;hui ?</h3>

      <Formik initialValues={initialValues} validate={validate} onSubmit={handleSubmit}>
        {({ values, errors, setFieldValue, isSubmitting, status }) => (
          <Form>
            <div className={styles.formWrapper}>
              {status && (
                <Alert
                  severity="error"
                  title="Une erreur s'est produite"
                  description={status}
                  className="fr-mb-3w"
                  closable
                  onClose={() => (status = null)}
                />
              )}

              <RadioButtons
                legend="Avez-vous pu rentrer en contact le jeune ?"
                name="contact-success"
                options={[
                  {
                    label: "Oui",
                    nativeInputProps: {
                      value: "oui",
                      checked: values.contactSuccess === true,
                      onChange: () => {
                        setFieldValue("contactSuccess", true);
                        setFieldValue("situation", null);
                        setFieldValue("probleme", "");
                        setFieldValue("action", null);
                      },
                    },
                  },
                  {
                    label: "Non",
                    nativeInputProps: {
                      value: "non",
                      checked: values.contactSuccess === false,
                      onChange: () => {
                        setFieldValue("contactSuccess", false);
                        setFieldValue("situation", null);
                        setFieldValue("probleme", "");
                        setFieldValue("action", null);
                      },
                    },
                  },
                ]}
                state="default"
                orientation="horizontal"
              />

              {values.contactSuccess === true && (
                <>
                  <RadioButtons
                    legend="Avez-vous un nouveau retour sur ce dossier ?"
                    name="situation"
                    options={[
                      {
                        label: "Rendez-vous pris à la Mission Locale",
                        nativeInputProps: {
                          value: SITUATION_ENUM.RDV_PRIS,
                          checked: values.situation === SITUATION_ENUM.RDV_PRIS,
                          onChange: () => setFieldValue("situation", SITUATION_ENUM.RDV_PRIS),
                        },
                      },
                      {
                        label: "Nouveau projet en cours",
                        nativeInputProps: {
                          value: SITUATION_ENUM.NOUVEAU_PROJET,
                          checked: values.situation === SITUATION_ENUM.NOUVEAU_PROJET,
                          onChange: () => setFieldValue("situation", SITUATION_ENUM.NOUVEAU_PROJET),
                        },
                        hintText: "Ex : nouveau contrat d'apprentissage, CDD, CDI, en formation initiale",
                      },
                      {
                        label: "Déjà accompagné par la Mission Locale et/ou un partenaire",
                        nativeInputProps: {
                          value: SITUATION_ENUM.DEJA_ACCOMPAGNE,
                          checked: values.situation === SITUATION_ENUM.DEJA_ACCOMPAGNE,
                          onChange: () => setFieldValue("situation", SITUATION_ENUM.DEJA_ACCOMPAGNE),
                        },
                        hintText: "Ex : Dossier « Milo actif », CEJ, PACEA, PAO",
                      },
                      {
                        label: "Autre situation / retour",
                        nativeInputProps: {
                          value: SITUATION_ENUM.AUTRE,
                          checked: values.situation === SITUATION_ENUM.AUTRE,
                          onChange: () => setFieldValue("situation", SITUATION_ENUM.AUTRE),
                        },
                      },
                    ]}
                    state="default"
                  />

                  {values.situation === SITUATION_ENUM.AUTRE && (
                    <Input
                      label="Précisez la situation"
                      nativeInputProps={{
                        value: values.situationAutre,
                        onChange: (e) => setFieldValue("situationAutre", e.target.value),
                      }}
                    />
                  )}

                  <Input
                    label="Avez-vous des commentaires ? (optionnel)"
                    textArea
                    nativeTextAreaProps={{
                      value: values.commentaires,
                      onChange: (e) => setFieldValue("commentaires", e.target.value),
                      rows: 3,
                    }}
                  />
                </>
              )}

              {values.contactSuccess === false && (
                <>
                  <Input
                    label="Quel est le problème selon vous ?"
                    textArea
                    nativeTextAreaProps={{
                      value: values.probleme,
                      onChange: (e) => setFieldValue("probleme", e.target.value),
                      placeholder: "Ex: Coordonnées incorrectes, Le jeune est injoignable, Autre...",
                      rows: 3,
                    }}
                  />

                  <RadioButtons
                    legend="Que souhaitez-vous faire ?"
                    name="action"
                    options={[
                      {
                        label: "Garder le jeune dans ma liste",
                        nativeInputProps: {
                          value: "garder",
                          checked: values.action === "garder",
                          onChange: () => setFieldValue("action", "garder"),
                        },
                        hintText: "Ce jeune restera à recontacter",
                      },
                      {
                        label: "Marquer le dossier du jeune comme traité",
                        nativeInputProps: {
                          value: "traiter",
                          checked: values.action === "traiter",
                          onChange: () => setFieldValue("action", "traiter"),
                        },
                        hintText: "Ce jeune passera dans les dossiers traités",
                      },
                    ]}
                    state="default"
                    orientation="horizontal"
                  />
                </>
              )}
            </div>

            <div className={styles.buttonContainer}>
              <Button priority="secondary" type="submit" disabled={isSubmitting || Object.keys(errors).length > 0}>
                Valider et quitter
              </Button>
              <Button type="submit" disabled={isSubmitting || Object.keys(errors).length > 0}>
                {isSubmitting ? "Validation..." : "Valider et passer au suivant"}
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}
