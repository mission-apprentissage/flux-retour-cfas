"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { useFormik } from "formik";
import Image from "next/image";
import { IEffectifMissionLocale, IUpdateMissionLocaleEffectif, SITUATION_ENUM } from "shared";

import { EffectifStatusBadge } from "@/app/_components/ruptures/shared/ui/EffectifStatusBadge";
import { formatDate, formatRelativeDate } from "@/app/_utils/date.utils";

import { withSharedStyles } from "../../shared/collaboration/withSharedStyles";

import { useMlUpdateEffectif } from "./hooks";
import localStyles from "./MlCollaborationDetail.module.css";

const styles = withSharedStyles(localStyles);

type EventIconType = "rupture" | "partage" | "traite" | "contacte-sans-reponse";

interface TimelineEvent {
  date: Date;
  title: string;
  subtext?: string;
  icon: EventIconType;
}

function getEventIcon(icon: EventIconType) {
  switch (icon) {
    case "rupture":
      return <Image src="/images/parcours-rupture.svg" alt="" width={20} height={20} />;
    case "partage":
      return <Image src="/images/parcours-partage-mission-locale.svg" alt="" width={18} height={18} />;
    case "contacte-sans-reponse":
      return <Image src="/images/parcours-contacte-sans-reponse.svg" alt="" width={18} height={17} />;
    case "traite":
    default:
      return <Image src="/images/parcours-dossier-traite.svg" alt="" width={18} height={18} />;
  }
}

function formatTimelineDate(date: Date): string {
  const relative = formatRelativeDate(date);
  if (relative === "aujourd'hui") return "Aujourd'hui";
  if (relative === "hier") return "Hier";
  return formatDate(date);
}

function toDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value === "object" && value !== null && "date" in value) {
    return new Date((value as { date: string | Date }).date as string);
  }
  return new Date(value as string);
}

function buildSuiviTimeline(effectif: IEffectifMissionLocale["effectif"]): TimelineEvent[] {
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

  if (effectif.organisme_data?.reponse_at && effectif.organisme_data.acc_conjoint === true) {
    const date = toDate(effectif.organisme_data.reponse_at);

    events.push({
      date,
      title: "Dossier envoyé par le CFA",
      subtext: effectif.contact_cfa ? `par ${effectif.contact_cfa.prenom} ${effectif.contact_cfa.nom}` : undefined,
      icon: "partage",
    });
  }

  if (effectif.mission_locale_logs) {
    effectif.mission_locale_logs.forEach((log) => {
      if (log.created_at && log.situation) {
        const date = toDate(log.created_at);

        if (log.situation === SITUATION_ENUM.CONTACTE_SANS_RETOUR) {
          events.push({
            date,
            title: "Contacté sans réponse",
            icon: "contacte-sans-reponse",
          });
        } else if (log.situation === SITUATION_ENUM.NOUVEAU_PROJET) {
          events.push({
            date,
            title: "Nouvelle situation",
            icon: "traite",
          });
        } else {
          events.push({
            date,
            title: "Dossier traité",
            icon: "traite",
          });
        }
      }
    });
  }

  return events.sort((a, b) => a.date.getTime() - b.date.getTime());
}

interface FormValues {
  contactReussi: boolean | null;
  rdvPris: boolean | null;
  situationNon: string | null;
  situationNonContact: "tentative_relancer" | "mauvaises_coordonnees" | null;
  situationJeune: string | null;
  commentaire: string;
}

function mapFormToPayload(values: FormValues): IUpdateMissionLocaleEffectif {
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
    if (values.situationNonContact === "tentative_relancer") {
      payload.situation = SITUATION_ENUM.CONTACTE_SANS_RETOUR;
    } else if (values.situationNonContact === "mauvaises_coordonnees") {
      payload.situation = SITUATION_ENUM.COORDONNEES_INCORRECT;
    }
  }

  if (values.situationJeune === "inconnu") {
    payload.deja_connu = false;
  } else if (values.situationJeune !== null) {
    payload.deja_connu = true;
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
  const timeline = buildSuiviTimeline(effectif);
  const showForm = effectif.organisme_data?.acc_conjoint === true && !timeline.some((e) => e.icon === "traite");

  const mutation = useMlUpdateEffectif();

  const formik = useFormik<FormValues>({
    initialValues: {
      contactReussi: null,
      rdvPris: null,
      situationNon: null,
      situationNonContact: null,
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
        if (values.situationNonContact === null) errors.situationNonContact = "Requis";
        if (values.situationJeune === null) errors.situationJeune = "Requis";
      }
      return errors;
    },
    onSubmit: (values) => {
      const payload = mapFormToPayload(values);
      mutation.mutate({ effectifId: effectif.id.toString(), data: payload });
    },
  });

  const { contactReussi } = formik.values;
  const isFormExpanded = showForm && contactReussi !== null;

  return (
    <div className={`${styles.suiviColumn} ${isFormExpanded ? styles.suiviColumnExpanded : ""}`}>
      <div className={styles.columnHeader}>
        <span>Suivi du dossier</span>
        <EffectifStatusBadge effectif={effectif} />
      </div>

      {!isFormExpanded && (
        <>
          {timeline.length > 0 ? (
            <div className={styles.suiviTimeline}>
              {timeline.map((event, index) => (
                <div key={`${event.title}-${index}`} className={styles.suiviEvent}>
                  <div className={styles.suiviEventIcon}>{getEventIcon(event.icon)}</div>
                  <div className={styles.suiviEventBody}>
                    <div className={styles.suiviEventHeader}>
                      <p className={styles.suiviEventTitle}>{event.title}</p>
                      <p className={styles.suiviEventDate}>{formatTimelineDate(event.date)}</p>
                    </div>
                    {event.subtext && <p className={styles.suiviEventSubtext}>{event.subtext}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.emptyTimeline}>Aucun événement à afficher.</p>
          )}
        </>
      )}

      {showForm && (
        <form
          onSubmit={formik.handleSubmit}
          className={isFormExpanded ? styles.dossierFormExpanded : styles.dossierForm}
        >
          <p className={styles.dossierFormTitle}>Du nouveau sur le dossier ?</p>

          <p className={styles.dossierFormLegend}>
            <span aria-hidden="true">{"📞 ✉️ "}</span>
            <strong>J&apos;ai réussi à joindre le jeune</strong> <em>(ou son responsable légal)</em>
            <span className={styles.required}> *</span>
          </p>
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

          {contactReussi === false && (
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
            (contactReussi === false && formik.values.situationNonContact !== null)) && (
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

          {contactReussi !== null && formik.values.situationJeune !== null && (
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
                value={formik.values.commentaire}
                onChange={formik.handleChange}
              />

              <div className={styles.commentaireCallout}>
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
              </div>
            </>
          )}

          {mutation.isError && <p className={styles.formError}>Une erreur est survenue. Veuillez réessayer.</p>}

          {mutation.isSuccess && <p className={styles.formSuccess}>Enregistré avec succès.</p>}

          <Button
            type="submit"
            disabled={!formik.isValid || mutation.isLoading}
            priority="secondary"
            className={`${styles.dossierFormButton} ${!formik.isValid || mutation.isLoading ? styles.dossierFormButtonDisabled : ""}`}
          >
            {mutation.isLoading ? "Envoi en cours..." : mutation.isSuccess ? "Enregistré" : "Valider et enregistrer"}
          </Button>
        </form>
      )}
    </div>
  );
}
