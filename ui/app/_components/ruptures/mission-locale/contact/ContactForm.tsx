"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { Formik, Form } from "formik";
import { SITUATION_ENUM, PROBLEME_TYPE_ENUM } from "shared";

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
  problemeAutre: string;
  action: "garder" | "traiter" | null;
}

const initialValues: FormValues = {
  contactSuccess: null,
  situation: null,
  situationAutre: "",
  commentaires: "",
  probleme: "",
  problemeAutre: "",
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
    if (!values.probleme) {
      errors.probleme = "Veuillez sélectionner un problème";
    }
    if (values.probleme === PROBLEME_TYPE_ENUM.AUTRE && !values.problemeAutre.trim()) {
      errors.problemeAutre = "Veuillez préciser le problème";
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
        : createContactFailurePayload(values.probleme, values.problemeAutre, values.action!);

      await recordContactMutation.mutateAsync({ effectifId, payload });
      onSuccess();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className={styles.container}>
      <h3 className={`fr-mb-1w ${styles.title}`}>Que se passe-t-il aujourd&apos;hui ?</h3>

      <Formik initialValues={initialValues} validate={validate} onSubmit={handleSubmit}>
        {({ values, setFieldValue, isSubmitting, status }) => {
          const isFormComplete =
            values.contactSuccess !== null &&
            (values.contactSuccess === true
              ? values.situation !== null && (values.situation !== SITUATION_ENUM.AUTRE || values.situationAutre.trim())
              : values.probleme !== "" &&
                (values.probleme !== PROBLEME_TYPE_ENUM.AUTRE || values.problemeAutre.trim()) &&
                values.action !== null);

          return (
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
                    <RadioButtons
                      legend="Quel est le problème selon vous ?"
                      name="probleme"
                      options={[
                        {
                          label: "Coordonnées incorrectes",
                          nativeInputProps: {
                            value: PROBLEME_TYPE_ENUM.COORDONNEES_INCORRECTES,
                            checked: values.probleme === PROBLEME_TYPE_ENUM.COORDONNEES_INCORRECTES,
                            onChange: () => setFieldValue("probleme", PROBLEME_TYPE_ENUM.COORDONNEES_INCORRECTES),
                          },
                        },
                        {
                          label: "Le jeune est injoignable",
                          nativeInputProps: {
                            value: PROBLEME_TYPE_ENUM.JEUNE_INJOIGNABLE,
                            checked: values.probleme === PROBLEME_TYPE_ENUM.JEUNE_INJOIGNABLE,
                            onChange: () => setFieldValue("probleme", PROBLEME_TYPE_ENUM.JEUNE_INJOIGNABLE),
                          },
                        },
                        {
                          label: "Autre (préciser)",
                          nativeInputProps: {
                            value: PROBLEME_TYPE_ENUM.AUTRE,
                            checked: values.probleme === PROBLEME_TYPE_ENUM.AUTRE,
                            onChange: () => setFieldValue("probleme", PROBLEME_TYPE_ENUM.AUTRE),
                          },
                        },
                      ]}
                      state="default"
                    />

                    {values.probleme === PROBLEME_TYPE_ENUM.AUTRE && (
                      <Input
                        label=""
                        textArea
                        nativeTextAreaProps={{
                          value: values.problemeAutre,
                          onChange: (e) => setFieldValue("problemeAutre", e.target.value),
                          placeholder: "Précisez le problème...",
                          rows: 3,
                        }}
                      />
                    )}

                    <RadioButtons
                      legend="Que souhaitez-vous faire ?"
                      name="action"
                      options={[
                        {
                          label: (
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              Garder le jeune dans ma liste
                              <p className="fr-badge fr-badge--purple-glycine" style={{ margin: 0 }}>
                                <i className="fr-icon-phone-fill fr-icon--sm" />
                                <span style={{ marginLeft: "5px" }}>À RECONTACTER</span>
                              </p>
                            </div>
                          ),
                          nativeInputProps: {
                            value: "garder",
                            checked: values.action === "garder",
                            onChange: () => setFieldValue("action", "garder"),
                          },
                          hintText: "Ce jeune restera à recontacter",
                        },
                        {
                          label: (
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              Marquer le dossier du jeune comme
                              <Badge severity="success">traité</Badge>
                            </div>
                          ),
                          nativeInputProps: {
                            value: "traiter",
                            checked: values.action === "traiter",
                            onChange: () => setFieldValue("action", "traiter"),
                          },
                          hintText: "Ce jeune passera dans les dossiers traités",
                        },
                      ]}
                      state="default"
                    />
                  </>
                )}
              </div>

              <div className={styles.buttonContainer}>
                <Button priority="secondary" type="submit" disabled={isSubmitting || !isFormComplete}>
                  Valider et quitter
                </Button>
                <Button type="submit" disabled={isSubmitting || !isFormComplete}>
                  {isSubmitting ? "Validation..." : "Valider et passer au suivant"}
                </Button>
              </div>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
}
