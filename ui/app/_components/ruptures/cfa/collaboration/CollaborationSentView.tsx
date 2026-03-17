"use client";

import { useState } from "react";
import { ACC_CONJOINT_MOTIF_ENUM, IEffectifMissionLocale } from "shared";

import { MOTIF_EMOJIS, MOTIF_LABELS } from "@/app/_components/ruptures/shared/constants";
import { useAuth } from "@/app/_context/UserContext";
import { formatDate } from "@/app/_utils/date.utils";
import { getUserDisplayName, isCurrentUserId } from "@/app/_utils/user.utils";

import styles from "./CfaCollaborationDetail.module.css";

export function CollaborationSentView({ effectif }: { effectif: IEffectifMissionLocale["effectif"] }) {
  const { user } = useAuth();
  const ml = effectif.mission_locale_organisation;
  const od = effectif.organisme_data;
  const [contactsOpen, setContactsOpen] = useState(false);
  const prenom = effectif.prenom;
  const mlName = ml?.nom;
  const mlCommune = ml?.adresse?.commune;

  const commentaires = od?.commentaires_par_motif;

  const motifs = od?.motif || [];
  const freinsMotifs = motifs.filter(
    (m) => m !== ACC_CONJOINT_MOTIF_ENUM.RECHERCHE_EMPLOI && m !== ACC_CONJOINT_MOTIF_ENUM.REORIENTATION
  );
  const hasRecherche = motifs.includes(ACC_CONJOINT_MOTIF_ENUM.RECHERCHE_EMPLOI);
  const hasReorientation = motifs.includes(ACC_CONJOINT_MOTIF_ENUM.REORIENTATION);

  const organismeName =
    (effectif.organisme as { nom?: string } | null)?.nom ||
    (effectif.organisme as { raison_sociale?: string } | null)?.raison_sociale ||
    "";

  const isCurrentUser = isCurrentUserId(od?.acc_conjoint_by, user?._id);
  const userName = getUserDisplayName(user);

  return (
    <>
      <div className={styles.sentHeader}>
        <span className={styles.sentHeaderTitle}>Collaboration avec la Mission Locale</span>
        <span className={styles.sentBadge}>
          <span className="fr-icon-send-plane-fill fr-icon--sm" aria-hidden="true" />
          Dossier envoyé à la ML
        </span>
      </div>

      <div className={styles.sentCallout}>
        <p className={styles.sentCalloutTitle}>
          <span className="fr-icon-info-fill fr-icon--sm" aria-hidden="true" />
          La Mission Locale {mlName}
          {mlCommune ? ` à ${mlCommune}` : ""} va contacter {prenom}.
        </p>
        <p className={styles.sentCalloutBody}>
          Dès que la Mission Locale aura réussi à joindre {prenom}, vous verrez son retour directement ici sur son
          dossier. Vous pouvez toujours contacter la Mission Locale dès maintenant si vous le souhaitez
        </p>

        {ml && (
          <>
            <button type="button" className={styles.sentContactToggle} onClick={() => setContactsOpen((o) => !o)}>
              Afficher les coordonnées de la Mission Locale {mlName}
              <span
                className={`fr-icon--sm ${contactsOpen ? "fr-icon-arrow-up-s-line" : "fr-icon-arrow-down-s-line"}`}
                aria-hidden="true"
              />
            </button>
            {contactsOpen && (
              <div className={styles.sentContactDetails}>
                {ml.email && <p>Email : {ml.email}</p>}
                {ml.telephone && <p>Téléphone : {ml.telephone}</p>}
              </div>
            )}
          </>
        )}
      </div>

      <div className={styles.sentBubble}>
        {motifs.length > 0 && (
          <div className={styles.sentBubbleSection}>
            <p className={styles.sentSectionTitle}>Quel accompagnement attendu ?</p>

            {hasRecherche && (
              <p className={styles.sentMotifInline}>
                <strong>
                  L&apos;aider dans sa recherche d&apos;entreprise{" "}
                  {MOTIF_EMOJIS[ACC_CONJOINT_MOTIF_ENUM.RECHERCHE_EMPLOI]}
                </strong>
                {commentaires?.[ACC_CONJOINT_MOTIF_ENUM.RECHERCHE_EMPLOI] && (
                  <> — {commentaires[ACC_CONJOINT_MOTIF_ENUM.RECHERCHE_EMPLOI]}</>
                )}
              </p>
            )}

            {freinsMotifs.map((motif) => (
              <p key={motif} className={styles.sentMotifInline}>
                <strong>
                  Frein de {MOTIF_LABELS[motif] || motif} {MOTIF_EMOJIS[motif] || ""}
                </strong>
                {commentaires?.[motif] && <> — {commentaires[motif]}</>}
              </p>
            ))}

            {hasReorientation && (
              <p className={styles.sentMotifInline}>
                <strong>
                  L&apos;aider dans sa réorientation {MOTIF_EMOJIS[ACC_CONJOINT_MOTIF_ENUM.REORIENTATION]}
                </strong>
              </p>
            )}
          </div>
        )}

        {od?.cause_rupture && (
          <div className={styles.sentBubbleSection}>
            <p className={styles.sentSectionTitle}>A propos de la rupture</p>
            <p className={styles.sentBody}>{od.cause_rupture}</p>
          </div>
        )}

        {od?.still_at_cfa != null && (
          <div className={styles.sentBubbleSection}>
            <p className={styles.sentStillAtCfa}>
              {prenom} est {od.still_at_cfa ? "encore en formation dans le CFA 📚" : "n'est plus en formation au CFA"}
            </p>
          </div>
        )}

        {od?.referent_coordonnees && (
          <div className={styles.sentBubbleSection}>
            <p className={styles.sentSectionTitle}>Référent(e) à contacter</p>
            {od.referent_coordonnees
              .split("\n")
              .filter(Boolean)
              .map((line, i) => (
                <p key={i} className={styles.sentBody}>
                  {line}
                </p>
              ))}
          </div>
        )}

        {od?.note_complementaire && (
          <div className={styles.sentBubbleSection}>
            <p className={styles.sentSectionTitle}>Note complémentaire</p>
            <p className={styles.sentBody}>{od.note_complementaire}</p>
          </div>
        )}
      </div>

      {od?.reponse_at && (
        <div className={styles.sentFooter}>
          <span className="fr-icon-send-plane-fill fr-icon--sm" aria-hidden="true" />
          <span>
            Dossier envoyé par le CFA{organismeName ? ` ${organismeName}` : ""}
            {userName ? `, par ${userName}${isCurrentUser ? " (vous)" : ""}` : ""}{" "}
            <span className={styles.sentFooterDate}>le {formatDate(od.reponse_at)}</span>
          </span>
        </div>
      )}
    </>
  );
}
