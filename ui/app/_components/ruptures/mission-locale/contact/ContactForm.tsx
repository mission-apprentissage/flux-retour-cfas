"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { useQueryClient } from "@tanstack/react-query";
import { Formik, Form, FormikHelpers } from "formik";
import { useState } from "react";
import { SITUATION_ENUM, PROBLEME_TYPE_ENUM, IEffectifMissionLocale } from "shared";

import {
  useRecordContact,
  createContactSuccessPayload,
  createContactFailurePayload,
  effectifQueryKeys,
} from "../../shared";

import styles from "./ContactForm.module.css";
import { SecondAttemptGuidance } from "./SecondAttemptGuidance";

interface FormValues {
  contactSuccess: boolean | null;
  situation: SITUATION_ENUM | null;
  situationAutre: string;
  commentaires: string;
  probleme: string;
  problemeAutre: string;
  action: "garder" | "traiter" | null;
}

interface ContactFormProps {
  effectifId: string;
  effectif?: IEffectifMissionLocale["effectif"];
  onSuccess: (shouldContinue?: boolean) => void;
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

const validate = (values: FormValues, isNouveauContrat: boolean) => {
  const errors: any = {};

  if (values.contactSuccess === null) {
    errors.contactSuccess = "Veuillez indiquer si vous êtes entré en contact avec ce jeune";
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
    if (isNouveauContrat) {
      if (!values.action) {
        errors.action = "Veuillez choisir une action";
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
  }

  return errors;
};

const hasMultipleContactAttempts = (effectif: IEffectifMissionLocale["effectif"]): boolean => {
  if (!effectif?.mission_locale_logs) return false;

  const contactAttempts = effectif.mission_locale_logs.filter(
    (log) => log.situation === SITUATION_ENUM.CONTACTE_SANS_RETOUR
  );

  return contactAttempts.length >= 2;
};

export function ContactForm({ effectifId, effectif, onSuccess }: ContactFormProps) {
  const recordContactMutation = useRecordContact();
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitAction, setSubmitAction] = useState<"quit" | "continue" | null>(null);

  const isNouveauContrat = effectif?.nouveau_contrat === true;

  const invalidateEffectifQueries = (effectifId: string) => {
    queryClient.invalidateQueries({ queryKey: effectifQueryKeys.detail(effectifId) });
    queryClient.invalidateQueries({ queryKey: effectifQueryKeys.all });
  };

  const handleSubmit = async (values: FormValues) => {
    try {
      setErrorMessage(null);

      let payload;
      if (values.contactSuccess) {
        payload = createContactSuccessPayload(values.situation!, values.situationAutre, values.commentaires);
      } else if (isNouveauContrat) {
        if (values.action === "traiter") {
          payload = createContactSuccessPayload(SITUATION_ENUM.NOUVEAU_CONTRAT);
        } else {
          payload = createContactSuccessPayload(SITUATION_ENUM.CONTACTE_SANS_RETOUR);
        }
      } else {
        payload = createContactFailurePayload(values.probleme, values.problemeAutre, values.action!);
      }

      await recordContactMutation.mutateAsync({ effectifId, payload });
      invalidateEffectifQueries(effectifId);

      const shouldContinue = submitAction === "continue";
      onSuccess(shouldContinue);
    } catch (error) {
      setErrorMessage("Une erreur est survenue lors de l'enregistrement du contact. Veuillez réessayer.");
    }
  };

  const handleReset = (setFieldValue: FormikHelpers<FormValues>["setFieldValue"]) => {
    setFieldValue("contactSuccess", null);
  };

  const handleTraiter = async () => {
    try {
      setErrorMessage(null);
      const payload = createContactSuccessPayload(SITUATION_ENUM.INJOIGNABLE_APRES_RELANCES);
      await recordContactMutation.mutateAsync({ effectifId, payload });
      invalidateEffectifQueries(effectifId);
      onSuccess(false);
    } catch (error) {
      setErrorMessage("Une erreur est survenue lors du traitement du dossier. Veuillez réessayer.");
    }
  };

  const shouldShowGuidance = effectif && hasMultipleContactAttempts(effectif);

  return (
    <div className={styles.container}>
      <h3 className={`fr-mb-1w ${styles.title}`}>
        {isNouveauContrat ? "Avez-vous pu rentrer en contact avec le jeune ?" : "Que se passe-t-il aujourd'hui ?"}
      </h3>

      <Formik
        initialValues={initialValues}
        validate={(values) => validate(values, isNouveauContrat)}
        onSubmit={handleSubmit}
      >
        {({ values, setFieldValue, isSubmitting }) => {
          const isFormComplete =
            values.contactSuccess !== null &&
            (values.contactSuccess === true
              ? values.situation !== null && (values.situation !== SITUATION_ENUM.AUTRE || values.situationAutre.trim())
              : isNouveauContrat
                ? values.action !== null
                : values.probleme !== "" &&
                  (values.probleme !== PROBLEME_TYPE_ENUM.AUTRE || values.problemeAutre.trim()) &&
                  values.action !== null);

          return (
            <Form>
              <div className={styles.formWrapper}>
                {errorMessage && (
                  <Alert
                    severity="error"
                    title="Une erreur s'est produite"
                    description={errorMessage}
                    className="fr-mb-3w"
                    closable
                    onClose={() => setErrorMessage(null)}
                  />
                )}

                <RadioButtons
                  legend="Êtes-vous entré en contact avec ce jeune ?"
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

                {values.contactSuccess === false &&
                  (shouldShowGuidance ? (
                    <SecondAttemptGuidance onReset={() => handleReset(setFieldValue)} onTraiter={handleTraiter} />
                  ) : isNouveauContrat ? (
                    <div>
                      <RadioButtons
                        legend="Que souhaitez-vous faire ?"
                        name="action"
                        options={[
                          {
                            label: (
                              <div className={styles.actionLabelContainer}>
                                Garder le jeune dans ma liste
                                <span className={`fr-badge fr-badge--purple-glycine ${styles.recontacterBadge}`}>
                                  <i className="fr-icon-phone-fill fr-icon--sm" />
                                  <span className={styles.recontacterIcon}>À RECONTACTER</span>
                                </span>
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
                              <div className={styles.actionLabelContainer}>
                                Marquer le dossier du jeune comme
                                <Badge severity="success">traité</Badge>
                              </div>
                            ),
                            nativeInputProps: {
                              value: "traiter",
                              checked: values.action === "traiter",
                              onChange: () => setFieldValue("action", "traiter"),
                            },
                            hintText: "Ce jeune a retrouvé un contrat d'apprentissage",
                          },
                        ]}
                        state="default"
                      />
                    </div>
                  ) : (
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
                              <div className={styles.actionLabelContainer}>
                                Garder le jeune dans ma liste
                                <span className={`fr-badge fr-badge--purple-glycine ${styles.recontacterBadge}`}>
                                  <i className="fr-icon-phone-fill fr-icon--sm" />
                                  <span className={styles.recontacterIcon}>À RECONTACTER</span>
                                </span>
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
                              <div className={styles.actionLabelContainer}>
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
                  ))}
              </div>

              {(!shouldShowGuidance || values.contactSuccess === true) && (
                <div className={styles.buttonContainer}>
                  <Button
                    priority="secondary"
                    type="submit"
                    disabled={isSubmitting || !isFormComplete}
                    onClick={() => setSubmitAction("quit")}
                  >
                    Valider et quitter
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !isFormComplete}
                    onClick={() => setSubmitAction("continue")}
                  >
                    {isSubmitting ? "Validation..." : "Valider et passer au suivant"}
                  </Button>
                </div>
              )}
            </Form>
          );
        }}
      </Formik>
    </div>
  );
}
