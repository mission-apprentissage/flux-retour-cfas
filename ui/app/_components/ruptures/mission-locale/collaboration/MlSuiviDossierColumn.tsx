"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { useFormik } from "formik";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { IEffectifMissionLocale, IUpdateMissionLocaleEffectif, SITUATION_ENUM } from "shared";

import { EffectifStatusBadge } from "@/app/_components/ruptures/shared/ui/EffectifStatusBadge";
import { useAuth } from "@/app/_context/UserContext";
import { formatDate } from "@/app/_utils/date.utils";

import { CollapsibleDetail } from "../../shared/collaboration/CollapsibleDetail";
import { DossierTraiteBubble } from "../../shared/collaboration/DossierTraiteBubble";
import {
  buildLogEvents,
  formatTimelineDate,
  getEventIcon,
  TimelineEvent,
  toDate,
} from "../../shared/collaboration/timeline.utils";
import { withSharedStyles } from "../../shared/collaboration/withSharedStyles";

import { useMlUpdateEffectif } from "./hooks";
import localStyles from "./MlCollaborationDetail.module.css";

const styles = withSharedStyles(localStyles);

function buildSuiviTimeline(effectif: IEffectifMissionLocale["effectif"], ctx: { userId?: string }): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  if (effectif.date_rupture) {
    const date = toDate(effectif.date_rupture);

    events.push({
      date,
      title: "Rupture du contrat d'apprentissage",
      subtext: effectif.transmitted_at
        ? effectif.source === "DECA"
          ? `Donnée captée depuis DECA le ${formatDate(effectif.transmitted_at)}`
          : `Donnée transmise par le CFA le ${formatDate(effectif.transmitted_at)}`
        : undefined,
      icon: "rupture",
    });
  }

  if (effectif.nouveau_contrat && effectif.current_status?.date) {
    const date = toDate(effectif.current_status.date);
    events.push({
      date,
      title: "Nouveau contrat signé",
      subtext: effectif.transmitted_at
        ? `Donnée transmise par l'ERP du CFA le ${formatDate(effectif.transmitted_at)}`
        : undefined,
      icon: "nouveau-contrat",
    });
  }

  if (effectif.organisme_data?.reponse_at && effectif.organisme_data.acc_conjoint === true) {
    const date = toDate(effectif.organisme_data.reponse_at);

    events.push({
      date,
      title: "Dossier envoyé par le CFA",
      subtext: effectif.contact_cfa ? `par ${effectif.contact_cfa.prenom} ${effectif.contact_cfa.nom}` : undefined,
      icon: "partage",
    });
  } else if (!effectif.organisme_data?.acc_conjoint && effectif.transmitted_at) {
    events.push({
      date: toDate(effectif.transmitted_at),
      title: "Dossier reçu automatiquement",
      icon: "partage",
    });
  }

  if (effectif.mission_locale_logs) {
    events.push(...buildLogEvents(effectif.mission_locale_logs, { userId: ctx.userId, showCurrentUser: true }));
  }

  return events.sort((a, b) => a.date.getTime() - b.date.getTime());
}

interface FormValues {
  contactReussi: boolean | null;
  rdvPris: boolean | null;
  situationNon: string | null;
  situationNonContact: "tentative_relancer" | "mauvaises_coordonnees" | null;
  problemeRecontact: "mauvaises_coordonnees" | "ne_souhaite_pas" | "autre" | null;
  actionRecontact: "garder_liste" | "marquer_traite" | null;
  situationJeune: string | null;
  commentaire: string;
}

function mapFormToPayload(
  values: FormValues,
  isRecontacterFlow: boolean,
  isNouveauContrat: boolean
): IUpdateMissionLocaleEffectif {
  const payload: IUpdateMissionLocaleEffectif = {};

  if (values.contactReussi === true) {
    if (values.rdvPris === true) {
      payload.situation = SITUATION_ENUM.RDV_PRIS;
    } else {
      switch (values.situationNon) {
        case "contrat_apprentissage":
          payload.situation = SITUATION_ENUM.NOUVEAU_CONTRAT;
          break;
        case "cdi_cdd":
          payload.situation = SITUATION_ENUM.NOUVEAU_PROJET;
          break;
        case "cherche_contrat":
          payload.situation = SITUATION_ENUM.CHERCHE_CONTRAT;
          break;
        case "reorientation":
          payload.situation = SITUATION_ENUM.REORIENTATION;
          break;
        case "ne_veut_pas":
          payload.situation = SITUATION_ENUM.NE_VEUT_PAS_ACCOMPAGNEMENT;
          break;
        case "autre":
          payload.situation = SITUATION_ENUM.AUTRE;
          break;
      }
    }
  } else if (values.contactReussi === false) {
    if (isRecontacterFlow) {
      if (values.actionRecontact === "garder_liste") {
        payload.situation = SITUATION_ENUM.CONTACTE_SANS_RETOUR;
      } else if (values.actionRecontact === "marquer_traite") {
        switch (values.problemeRecontact) {
          case "mauvaises_coordonnees":
            payload.situation = SITUATION_ENUM.COORDONNEES_INCORRECT;
            break;
          case "ne_souhaite_pas":
            payload.situation = SITUATION_ENUM.NE_VEUT_PAS_ACCOMPAGNEMENT;
            break;
          case "autre":
            payload.situation = SITUATION_ENUM.AUTRE;
            break;
        }
      }
    } else if (isNouveauContrat) {
      if (values.actionRecontact === "garder_liste") {
        payload.situation = SITUATION_ENUM.CONTACTE_SANS_RETOUR;
      } else if (values.actionRecontact === "marquer_traite") {
        payload.situation = SITUATION_ENUM.NOUVEAU_CONTRAT;
      }
    } else {
      if (values.situationNonContact === "tentative_relancer") {
        payload.situation = SITUATION_ENUM.CONTACTE_SANS_RETOUR;
      } else if (values.situationNonContact === "mauvaises_coordonnees") {
        payload.situation = SITUATION_ENUM.COORDONNEES_INCORRECT;
      }
    }
  }

  if (!isRecontacterFlow || values.contactReussi === true) {
    if (values.situationJeune === "inconnu") {
      payload.deja_connu = false;
    } else if (values.situationJeune !== null) {
      payload.deja_connu = true;
    }
  }

  if (values.commentaire) {
    payload.commentaires = values.commentaire;
  }

  return payload;
}

interface MlSuiviDossierColumnProps {
  effectif: IEffectifMissionLocale["effectif"];
}

export function MlSuiviDossierColumn({ effectif }: MlSuiviDossierColumnProps) {
  const { user } = useAuth();
  const timeline = buildSuiviTimeline(effectif, { userId: user?._id });
  const isDossierTraite = timeline.some((e) => e.icon === "traite" || e.icon === "injoignable");
  const recontacterCount = timeline.filter((e) => e.icon === "recontacter").length;
  const isRecontacter = recontacterCount > 0 && !isDossierTraite;

  const mutation = useMlUpdateEffectif();
  const commentMutation = useMlUpdateEffectif();

  const [lastSubmitWasRecontacter, setLastSubmitWasRecontacter] = useState(false);

  const collabStarted = effectif.organisme_data?.acc_conjoint === true;
  const cfaIsTdbUser = !!effectif.organisme?.ml_beta_activated_at;
  const isDecaCfa = !!effectif.organisme?.is_allowed_deca;
  const daysSinceRupture = effectif.date_rupture?.date
    ? (Date.now() - new Date(effectif.date_rupture.date).getTime()) / (1000 * 60 * 60 * 24)
    : 0;

  // ML peut traiter si :
  // - collab active (CFA a envoyé le dossier)
  // - CFA non utilisateur TDB (pas de collab possible)
  // - effectif grandfathéré (créé avant l'activation du CFA sur TDB)
  // - CFA est à la fois TDB et DECA uniquement, et 45j écoulés depuis la rupture (délai de grâce)
  const canProcessDossier =
    collabStarted || !cfaIsTdbUser || !!effectif.is_grandfathered || (isDecaCfa && daysSinceRupture >= 45);
  const isStandaloneMode = canProcessDossier && !collabStarted;

  const showForm = canProcessDossier && !isDossierTraite && !isRecontacter && !mutation.isSuccess;
  const showRecontacterForm = canProcessDossier && isRecontacter;
  const showCommentForm =
    canProcessDossier && (isDossierTraite || (mutation.isSuccess && !lastSubmitWasRecontacter)) && !isRecontacter;
  const [postComment, setPostComment] = useState("");
  const mutationTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const commentTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => {
      if (mutationTimerRef.current) clearTimeout(mutationTimerRef.current);
      if (commentTimerRef.current) clearTimeout(commentTimerRef.current);
    };
  }, []);

  const formik = useFormik<FormValues>({
    initialValues: {
      contactReussi: null,
      rdvPris: null,
      situationNon: null,
      situationNonContact: null,
      problemeRecontact: null,
      actionRecontact: null,
      situationJeune: null,
      commentaire: "",
    },
    validateOnMount: true,
    validate: (values) => {
      const errors: Record<string, string> = {};
      if (values.contactReussi === null) errors.contactReussi = "Requis";
      if (values.contactReussi === true) {
        if (values.rdvPris === null) errors.rdvPris = "Requis";
        if (values.rdvPris === false && values.situationNon === null) errors.situationNon = "Requis";
        if (values.situationJeune === null) errors.situationJeune = "Requis";
      }
      if (values.contactReussi === false) {
        if (showRecontacterForm) {
          if (values.problemeRecontact === null) errors.problemeRecontact = "Requis";
          if (values.problemeRecontact === "autre" && !values.commentaire.trim()) errors.commentaire = "Requis";
          if (values.actionRecontact === null) errors.actionRecontact = "Requis";
        } else if (effectif.nouveau_contrat) {
          if (values.actionRecontact === null) errors.actionRecontact = "Requis";
          if (values.situationJeune === null) errors.situationJeune = "Requis";
        } else {
          if (values.situationNonContact === null) errors.situationNonContact = "Requis";
          if (values.situationJeune === null) errors.situationJeune = "Requis";
        }
      }
      return errors;
    },
    onSubmit: (values) => {
      const payload = mapFormToPayload(values, showRecontacterForm, !!effectif.nouveau_contrat);
      const isRecontacterPayload = payload.situation === SITUATION_ENUM.CONTACTE_SANS_RETOUR;
      setLastSubmitWasRecontacter(isRecontacterPayload);
      mutation.mutate(
        { effectifId: effectif.id.toString(), data: payload },
        {
          onSuccess: () => {
            if (isRecontacterPayload) {
              formik.resetForm();
              mutationTimerRef.current = setTimeout(() => mutation.reset(), 2000);
            }
          },
        }
      );
    },
  });

  const { contactReussi } = formik.values;
  const isFormExpanded = (showForm || showRecontacterForm) && contactReussi !== null;

  return (
    <div className={`${styles.suiviColumn} ${isFormExpanded ? styles.suiviColumnExpanded : ""}`}>
      <div className={styles.columnHeader}>
        <span>Suivi du dossier</span>
        <EffectifStatusBadge effectif={{ ...effectif, nouveau_contrat: false }} />
      </div>

      {!isFormExpanded && (
        <>
          {timeline.length > 0 ? (
            <div className={styles.suiviTimeline}>
              {timeline.map((event, index) => (
                <div key={`${event.title}-${index}`} className={styles.suiviEvent}>
                  <div className={styles.suiviEventIcon}>{getEventIcon(event.icon, styles)}</div>
                  <div className={styles.suiviEventBody}>
                    <div className={styles.suiviEventHeader}>
                      <p className={styles.suiviEventTitle}>{event.title}</p>
                      <p className={styles.suiviEventDate}>{formatTimelineDate(event.date)}</p>
                    </div>
                    {event.log &&
                    (event.icon === "traite" || event.icon === "recontacter" || event.icon === "injoignable") ? (
                      <CollapsibleDetail subtext={event.subtext} subtextClassName={styles.suiviEventSubtext}>
                        <DossierTraiteBubble log={event.log} />
                      </CollapsibleDetail>
                    ) : event.log && event.icon === "commentaire" && event.log.commentaires ? (
                      <CollapsibleDetail subtext={event.subtext} subtextClassName={styles.suiviEventSubtext}>
                        <p className={styles.suiviCommentText}>{event.log.commentaires}</p>
                      </CollapsibleDetail>
                    ) : (
                      event.subtext && <p className={styles.suiviEventSubtext}>{event.subtext}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.emptyTimeline}>Aucun événement à afficher.</p>
          )}
        </>
      )}

      {showCommentForm && (
        <div className={styles.postCommentFormWrapper}>
          <div className={styles.postCommentForm}>
            <p className={styles.postCommentTitle}>Du nouveau sur le dossier ?</p>
            <div className={styles.postCommentFormContent}>
              <p className={styles.dossierFormLegend}>
                <span aria-hidden="true">{"📝 "}</span>
                <strong>Décrivez la nouvelle situation</strong>
              </p>
              <p className={styles.postCommentSubtitle}>
                Exemple : Compte rendu d&apos;un rdv pris, information d&apos;absence a un rdv convenu, information de
                nouveau projet construit...
              </p>
              <textarea
                className={styles.commentaireTextarea}
                placeholder="Écrivez ici"
                aria-label="Décrivez la nouvelle situation"
                value={postComment}
                onChange={(e) => setPostComment(e.target.value)}
              />
            </div>
            {commentMutation.isError && (
              <p className={styles.formError}>Une erreur est survenue. Veuillez réessayer.</p>
            )}
            {commentMutation.isSuccess && <p className={styles.formSuccess}>Commentaire envoyé.</p>}
            <Button
              type="button"
              priority={postComment.trim() ? "primary" : "secondary"}
              disabled={!postComment.trim() || commentMutation.isLoading}
              className={`${styles.dossierFormButton} ${!postComment.trim() || commentMutation.isLoading ? styles.dossierFormButtonDisabled : ""}`}
              onClick={() => {
                commentMutation.mutate(
                  { effectifId: effectif.id.toString(), data: { commentaires: postComment.trim() } },
                  {
                    onSuccess: () => {
                      setPostComment("");
                      commentTimerRef.current = setTimeout(() => commentMutation.reset(), 3000);
                    },
                  }
                );
              }}
            >
              {commentMutation.isLoading ? "Envoi en cours..." : "Envoyer le commentaire"}
            </Button>
          </div>
        </div>
      )}

      {(showForm || showRecontacterForm) && (
        <form
          onSubmit={formik.handleSubmit}
          className={
            isFormExpanded
              ? styles.dossierFormExpanded
              : showRecontacterForm
                ? styles.dossierFormBottom
                : styles.dossierForm
          }
        >
          <p className={styles.dossierFormTitle}>Du nouveau sur le dossier ?</p>

          <fieldset className={styles.radioFieldset}>
            <legend className={styles.dossierFormLegend}>
              <span aria-hidden="true">{"📞 ✉️ "}</span>
              <strong>J&apos;ai réussi à joindre le jeune</strong> <em>(ou son responsable légal)</em>
              <span className={styles.required}> *</span>
            </legend>
            <p className={styles.dossierFormHint}>
              Si vous avez tenté de joindre le jeune, laissé un message vocal ou un mail sans réponse, répondez non
            </p>

            <div className={styles.radioCardGroup}>
              <label className={`${styles.radioCard} ${contactReussi === true ? styles.radioCardSelected : ""}`}>
                <input
                  type="radio"
                  name="contactReussi"
                  className={styles.radioInput}
                  checked={contactReussi === true}
                  onChange={() => {
                    formik.setValues({
                      ...formik.values,
                      contactReussi: true,
                      situationNonContact: null,
                      situationJeune: null,
                      commentaire: "",
                    });
                  }}
                />
                Oui
              </label>
              <label className={`${styles.radioCard} ${contactReussi === false ? styles.radioCardSelected : ""}`}>
                <input
                  type="radio"
                  name="contactReussi"
                  className={styles.radioInput}
                  checked={contactReussi === false}
                  onChange={() => {
                    formik.setValues({
                      ...formik.values,
                      contactReussi: false,
                      rdvPris: null,
                      situationNon: null,
                      situationJeune: null,
                      commentaire: "",
                    });
                  }}
                />
                Non
              </label>
            </div>
          </fieldset>

          {contactReussi === false && effectif.nouveau_contrat && (
            <div className={styles.nouveauContratCallout}>
              <p className={styles.nouveauContratCalloutTitle}>
                <i className="fr-icon-info-fill fr-icon--sm" />
                Le jeune a signé un nouveau contrat
              </p>
              <p className={styles.nouveauContratCalloutBody}>
                Le jeune pourrait toujours avoir des difficultés et des freins périphériques matériels ou sociaux. Sur
                ce dossier si vous souhaitez tenter de joindre le jeune gardez-le dans votre liste{" "}
                <strong>&quot;🔄 À recontacter&quot;</strong>. Sinon vous pouvez dès à présent marquer son dossier comme{" "}
                <strong>&quot;✅ Traité&quot;</strong>.
              </p>
            </div>
          )}

          {contactReussi === false && effectif.nouveau_contrat && (
            <>
              <hr className={styles.dossierFormSeparator} />

              <p className={`${styles.dossierFormLegend} ${styles.dossierFormLegendBold}`}>
                Que souhaitez-vous faire ?<span className={styles.required}> *</span>
              </p>

              <div className={styles.radioCardGroupVertical}>
                <label
                  className={`${styles.radioCard} ${formik.values.actionRecontact === "garder_liste" ? styles.radioCardSelected : ""}`}
                >
                  <input
                    type="radio"
                    name="actionRecontact"
                    className={styles.radioInput}
                    checked={formik.values.actionRecontact === "garder_liste"}
                    onChange={() => formik.setFieldValue("actionRecontact", "garder_liste")}
                  />
                  <div>
                    <span>
                      <span aria-hidden="true">🔄</span> Garder le jeune dans ma liste &quot;À recontacter&quot;
                    </span>
                  </div>
                </label>

                <label
                  className={`${styles.radioCard} ${formik.values.actionRecontact === "marquer_traite" ? styles.radioCardSelected : ""}`}
                >
                  <input
                    type="radio"
                    name="actionRecontact"
                    className={styles.radioInput}
                    checked={formik.values.actionRecontact === "marquer_traite"}
                    onChange={() => formik.setFieldValue("actionRecontact", "marquer_traite")}
                  />
                  <div>
                    <span>
                      <span aria-hidden="true">✅</span> Marquer le dossier du jeune comme &quot;Traité&quot;
                    </span>
                    <span className={styles.recommendedLabel}>• Recommandé</span>
                  </div>
                </label>
              </div>
            </>
          )}

          {contactReussi === false && !showRecontacterForm && !effectif.nouveau_contrat && (
            <>
              <hr className={styles.dossierFormSeparator} />

              <p className={`${styles.dossierFormLegend} ${styles.dossierFormLegendBold}`}>
                <span aria-hidden="true">{"🔍 "}</span>
                Quelle est la situation ?<span className={styles.required}> *</span>
              </p>

              <div className={styles.radioCardGroupVertical}>
                <label
                  className={`${styles.radioCard} ${formik.values.situationNonContact === "tentative_relancer" ? styles.radioCardSelected : ""}`}
                >
                  <input
                    type="radio"
                    name="situationNonContact"
                    className={styles.radioInput}
                    checked={formik.values.situationNonContact === "tentative_relancer"}
                    onChange={() => {
                      formik.setValues({
                        ...formik.values,
                        situationNonContact: "tentative_relancer",
                        situationJeune: null,
                        commentaire: "",
                      });
                    }}
                  />
                  <span aria-hidden="true">🔄</span> Tentative de contact, à relancer
                </label>

                {formik.values.situationNonContact === "tentative_relancer" && (
                  <div className={styles.tentativeCallout}>
                    <div className={styles.tentativeCalloutHeader}>
                      <p className={styles.tentativeCalloutTitle}>
                        <i
                          className={`fr-icon-info-fill fr-icon--sm ${styles.tentativeCalloutIcon}`}
                          aria-hidden="true"
                        />{" "}
                        Nous envoyons automatiquement un message à{" "}
                        <span className={styles.tentativeCalloutPrenom}>{effectif.prenom}</span> pour le notifier de
                        votre tentative de contact.
                      </p>
                      <button
                        type="button"
                        className={styles.tentativeCalloutClose}
                        aria-label="Fermer"
                        onClick={() => formik.setFieldValue("situationNonContact", null)}
                      >
                        ×
                      </button>
                    </div>
                    <p className={styles.tentativeCalloutBody}>
                      L&apos;équipe Tableau de Bord vous notifiera de sa réponse si il ou elle précise vouloir être
                      recontacté·e ou non.
                    </p>
                  </div>
                )}

                <label
                  className={`${styles.radioCard} ${formik.values.situationNonContact === "mauvaises_coordonnees" ? styles.radioCardSelected : ""}`}
                >
                  <input
                    type="radio"
                    name="situationNonContact"
                    className={styles.radioInput}
                    checked={formik.values.situationNonContact === "mauvaises_coordonnees"}
                    onChange={() => {
                      formik.setValues({
                        ...formik.values,
                        situationNonContact: "mauvaises_coordonnees",
                        situationJeune: null,
                        commentaire: "",
                      });
                    }}
                  />
                  <span aria-hidden="true">❌</span> Mauvaises coordonnées / Injoignable
                </label>
              </div>
            </>
          )}

          {contactReussi === false && showRecontacterForm && recontacterCount < 2 && (
            <>
              <hr className={styles.dossierFormSeparator} />

              <p className={`${styles.dossierFormLegend} ${styles.dossierFormLegendBold}`}>
                <span aria-hidden="true">{"🔍 "}</span>
                C&apos;est la 2e fois que vous essayez de joindre ce jeune, quel est le problème selon vous ?
                <span className={styles.required}> *</span>
              </p>

              <div className={styles.radioCardGroupVertical}>
                <label
                  className={`${styles.radioCard} ${formik.values.problemeRecontact === "mauvaises_coordonnees" ? styles.radioCardSelected : ""}`}
                >
                  <input
                    type="radio"
                    name="problemeRecontact"
                    className={styles.radioInput}
                    checked={formik.values.problemeRecontact === "mauvaises_coordonnees"}
                    onChange={() => {
                      formik.setValues({
                        ...formik.values,
                        problemeRecontact: "mauvaises_coordonnees",
                        actionRecontact: null,
                        commentaire: "",
                      });
                    }}
                  />
                  <span aria-hidden="true">❌</span> Mauvaises coordonnées
                </label>

                <label
                  className={`${styles.radioCard} ${formik.values.problemeRecontact === "ne_souhaite_pas" ? styles.radioCardSelected : ""}`}
                >
                  <input
                    type="radio"
                    name="problemeRecontact"
                    className={styles.radioInput}
                    checked={formik.values.problemeRecontact === "ne_souhaite_pas"}
                    onChange={() => {
                      formik.setValues({
                        ...formik.values,
                        problemeRecontact: "ne_souhaite_pas",
                        actionRecontact: null,
                        commentaire: "",
                      });
                    }}
                  />
                  <span aria-hidden="true">❌</span> Le jeune ne souhaite pas répondre
                </label>

                <label
                  className={`${styles.radioCard} ${formik.values.problemeRecontact === "autre" ? styles.radioCardSelected : ""}`}
                >
                  <input
                    type="radio"
                    name="problemeRecontact"
                    className={styles.radioInput}
                    checked={formik.values.problemeRecontact === "autre"}
                    onChange={() => {
                      formik.setValues({
                        ...formik.values,
                        problemeRecontact: "autre",
                        actionRecontact: null,
                        commentaire: "",
                      });
                    }}
                  />
                  Autre (précisions obligatoires)
                </label>
              </div>

              {formik.values.problemeRecontact === "autre" && (
                <textarea
                  name="commentaire"
                  className={styles.commentaireTextarea}
                  placeholder="Précisez le problème rencontré"
                  aria-label="Précisez le problème rencontré"
                  value={formik.values.commentaire}
                  onChange={formik.handleChange}
                />
              )}

              {formik.values.problemeRecontact !== null && (
                <>
                  <hr className={styles.dossierFormSeparator} />

                  <p className={`${styles.dossierFormLegend} ${styles.dossierFormLegendBold}`}>
                    Que souhaitez-vous faire ?<span className={styles.required}> *</span>
                  </p>

                  <div className={styles.radioCardGroupVertical}>
                    <label
                      className={`${styles.radioCard} ${formik.values.actionRecontact === "garder_liste" ? styles.radioCardSelected : ""}`}
                    >
                      <input
                        type="radio"
                        name="actionRecontact"
                        className={styles.radioInput}
                        checked={formik.values.actionRecontact === "garder_liste"}
                        onChange={() => formik.setFieldValue("actionRecontact", "garder_liste")}
                      />
                      <div>
                        <span>
                          <span aria-hidden="true">🔄</span> Garder le jeune dans ma liste &quot;À recontacter&quot;
                        </span>
                      </div>
                    </label>

                    <label
                      className={`${styles.radioCard} ${formik.values.actionRecontact === "marquer_traite" ? styles.radioCardSelected : ""}`}
                    >
                      <input
                        type="radio"
                        name="actionRecontact"
                        className={styles.radioInput}
                        checked={formik.values.actionRecontact === "marquer_traite"}
                        onChange={() => formik.setFieldValue("actionRecontact", "marquer_traite")}
                      />
                      <div>
                        <span>
                          <span aria-hidden="true">✅</span> Marquer le dossier du jeune comme &quot;Traité&quot;
                        </span>
                        <span className={styles.recommendedLabel}>• Recommandé</span>
                      </div>
                    </label>
                  </div>
                </>
              )}
            </>
          )}

          {contactReussi === false && showRecontacterForm && recontacterCount >= 2 && (
            <>
              <hr className={styles.dossierFormSeparator} />

              <p className={styles.recontacteText}>
                Vous avez déjà essayé de contacter le jeune à plusieurs reprises. Nous vous conseillons de marquer son
                dossier comme traité.
              </p>

              <div className={styles.recontacteImageWrapper}>
                <Image
                  src="/images/recontacte.png"
                  alt="À recontacter vers Traité"
                  width={0}
                  height={0}
                  sizes="100%"
                  style={{ width: "100%", height: "auto" }}
                />
              </div>

              <p className={styles.recontacteText}>Que souhaitez-vous faire ?</p>

              <div className={styles.recontacteButtons}>
                <Button
                  type="button"
                  priority="primary"
                  className={styles.dossierFormButton}
                  disabled={mutation.isLoading}
                  onClick={() => {
                    mutation.mutate({
                      effectifId: effectif.id.toString(),
                      data: { situation: SITUATION_ENUM.INJOIGNABLE_APRES_RELANCES },
                    });
                  }}
                >
                  {mutation.isLoading ? "Envoi en cours..." : "Confirmer et marquer comme traité"}
                </Button>
                <Button
                  type="button"
                  priority="secondary"
                  className={styles.dossierFormButton}
                  onClick={() => formik.resetForm()}
                >
                  Revenir plus tard
                </Button>
              </div>

              {mutation.isError && <p className={styles.formError}>Une erreur est survenue. Veuillez réessayer.</p>}
              {mutation.isSuccess && <p className={styles.formSuccess}>Enregistré avec succès.</p>}
            </>
          )}

          {contactReussi === true && (
            <>
              <hr className={styles.dossierFormSeparator} />

              <p className={`${styles.dossierFormLegend} ${styles.dossierFormLegendBold}`}>
                <span aria-hidden="true">{"📅 "}</span>
                Nous avons <span className={styles.highlight}>pris un RDV</span> pour commencer ou poursuivre un
                accompagnement à la Mission Locale
                <span className={styles.required}> *</span>
              </p>

              <div className={styles.radioCardGroup}>
                <label
                  className={`${styles.radioCard} ${formik.values.rdvPris === true ? styles.radioCardSelected : ""}`}
                >
                  <input
                    type="radio"
                    name="rdvPris"
                    className={styles.radioInput}
                    checked={formik.values.rdvPris === true}
                    onChange={() => formik.setFieldValue("rdvPris", true)}
                  />
                  Oui
                </label>
                <label
                  className={`${styles.radioCard} ${formik.values.rdvPris === false ? styles.radioCardSelected : ""}`}
                >
                  <input
                    type="radio"
                    name="rdvPris"
                    className={styles.radioInput}
                    checked={formik.values.rdvPris === false}
                    onChange={() => formik.setFieldValue("rdvPris", false)}
                  />
                  Non
                </label>
              </div>
            </>
          )}

          {contactReussi === true && formik.values.rdvPris === false && (
            <>
              <hr className={styles.dossierFormSeparator} />

              <p className={`${styles.dossierFormLegend} ${styles.dossierFormLegendBold}`}>
                Quelle est la situation du jeune ?<span className={styles.required}> *</span>
              </p>

              <div className={styles.radioListGroup}>
                {[
                  {
                    value: "contrat_apprentissage",
                    emoji: "✅",
                    label: "Le jeune est déjà en contrat d'apprentissage",
                  },
                  { value: "cdi_cdd", emoji: "✅", label: "Le jeune a signé un CDI ou un CDD" },
                  {
                    value: "cherche_contrat",
                    emoji: "🔍",
                    label: "Le jeune cherche toujours un contrat mais ne souhaite pas l'aide de la Mission Locale",
                  },
                  {
                    value: "reorientation",
                    emoji: "🧭",
                    label: "Le jeune se réoriente mais ne veut pas être aidé par la Mission Locale",
                  },
                  { value: "ne_veut_pas", emoji: "❌", label: "Ne veut pas être accompagné", danger: true },
                  { value: "autre", label: "Autre chose ?", hint: "Un déménagement ?" },
                ].map((option) => (
                  <label key={option.value} className={styles.radioListItem}>
                    <input
                      type="radio"
                      name="situationNon"
                      className={styles.radioInput}
                      checked={formik.values.situationNon === option.value}
                      onChange={() => formik.setFieldValue("situationNon", option.value)}
                    />
                    <div>
                      <span
                        className={`${styles.radioListLabel} ${"danger" in option && option.danger ? styles.radioListLabelDanger : ""}`}
                      >
                        {"emoji" in option && <span aria-hidden="true">{option.emoji} </span>}
                        {option.label}
                      </span>
                      {option.hint && <span className={styles.radioListHint}>{option.hint}</span>}
                    </div>
                  </label>
                ))}
              </div>
            </>
          )}

          {((contactReussi === true && formik.values.rdvPris !== null) ||
            (contactReussi === false &&
              !showRecontacterForm &&
              !effectif.nouveau_contrat &&
              formik.values.situationNonContact !== null) ||
            (contactReussi === false && effectif.nouveau_contrat && formik.values.actionRecontact !== null)) && (
            <>
              <hr className={styles.dossierFormSeparator} />

              <p className={`${styles.dossierFormLegend} ${styles.dossierFormLegendBold}`}>
                Le jeune était-il déjà accompagné par votre Mission Locale ?<span className={styles.required}> *</span>
              </p>

              <div className={styles.radioListGroup}>
                <label className={styles.radioListItem}>
                  <input
                    type="radio"
                    name="situationJeune"
                    className={styles.radioInput}
                    checked={formik.values.situationJeune === "accompagne"}
                    onChange={() => formik.setFieldValue("situationJeune", "accompagne")}
                  />
                  <div>
                    <span className={styles.radioListLabel}>Connu et déjà accompagné activement</span>
                    <span className={styles.radioListHint}>Déjà en PACEA, CEJ ou suivi régulier</span>
                  </div>
                </label>

                <label className={styles.radioListItem}>
                  <input
                    type="radio"
                    name="situationJeune"
                    className={styles.radioInput}
                    checked={formik.values.situationJeune === "connu"}
                    onChange={() => formik.setFieldValue("situationJeune", "connu")}
                  />
                  <div>
                    <span className={styles.radioListLabel}>Connu mais il n&apos;était pas en accompagnement</span>
                    <span className={styles.radioListHint}>
                      Dans les listes RIO, décrocheurs, ou jeune qui n&apos;a pas été vu depuis 6 mois
                    </span>
                  </div>
                </label>

                <label className={styles.radioListItem}>
                  <input
                    type="radio"
                    name="situationJeune"
                    className={styles.radioInput}
                    checked={formik.values.situationJeune === "inconnu"}
                    onChange={() => formik.setFieldValue("situationJeune", "inconnu")}
                  />
                  <div>
                    <span className={styles.radioListLabel}>Non connu de la Mission Locale</span>
                  </div>
                </label>
              </div>
            </>
          )}

          {contactReussi !== null &&
            formik.values.situationJeune !== null &&
            !(showRecontacterForm && contactReussi === false) && (
              <>
                <hr className={styles.dossierFormSeparator} />

                <p className={styles.dossierFormLegend}>
                  <span aria-hidden="true">{"📝 "}</span>
                  <strong>Un commentaire à ajouter ?</strong> <em className={styles.facultatif}>Facultatif</em>
                </p>

                <textarea
                  name="commentaire"
                  className={styles.commentaireTextarea}
                  placeholder="Quelques mots sur la situation"
                  aria-label="Commentaire sur la situation"
                  value={formik.values.commentaire}
                  onChange={formik.handleChange}
                />

                <div className={styles.commentaireCallout}>
                  {isStandaloneMode ? (
                    <>
                      <p className={styles.commentaireCalloutTitle}>
                        <i className="fr-icon-lightbulb-line fr-icon--sm" aria-hidden="true" />{" "}
                        <strong>Ajoutez un commentaire</strong>
                      </p>
                      <p className={styles.commentaireCalloutBody}>
                        Ajoutez un commentaire pour garder une trace de votre suivi.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className={styles.commentaireCalloutTitle}>
                        <i className="fr-icon-lightbulb-line fr-icon--sm" aria-hidden="true" />{" "}
                        <strong>Ajoutez un commentaire pour le CFA</strong>
                      </p>
                      <p className={styles.commentaireCalloutBody}>
                        Ce dossier vous a été transmis par le CFA{" "}
                        <strong>{effectif.organisme?.nom || effectif.organisme?.raison_sociale || ""}</strong>
                        .
                        <br />
                        <span aria-hidden="true">{"💡 "}</span>Ajoutez un commentaire à votre saisie est un plus pour la
                        collaboration.
                      </p>
                    </>
                  )}
                </div>
              </>
            )}

          {!(showRecontacterForm && contactReussi === false && recontacterCount >= 2) && (
            <>
              {mutation.isError && <p className={styles.formError}>Une erreur est survenue. Veuillez réessayer.</p>}

              {mutation.isSuccess && <p className={styles.formSuccess}>Enregistré avec succès.</p>}

              <Button
                type="submit"
                disabled={!formik.isValid || mutation.isLoading}
                priority={formik.isValid ? "primary" : "secondary"}
                className={`${styles.dossierFormButton} ${!formik.isValid || mutation.isLoading ? styles.dossierFormButtonDisabled : ""}`}
              >
                {mutation.isLoading
                  ? "Envoi en cours..."
                  : mutation.isSuccess
                    ? "Enregistré"
                    : "Valider et enregistrer"}
              </Button>
            </>
          )}
        </form>
      )}
    </div>
  );
}
