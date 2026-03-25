"use client";

import { ACC_CONJOINT_MOTIF_ENUM, IEffectifMissionLocale } from "shared";

import { MOTIF_EMOJIS, MOTIF_LABELS } from "@/app/_components/ruptures/shared/constants";
import { formatDate } from "@/app/_utils/date.utils";

import { withSharedStyles } from "../../shared/collaboration/withSharedStyles";

import localStyles from "./MlCollaborationDetail.module.css";

const styles = withSharedStyles(localStyles);

export function CollaborationReceivedView({ effectif }: { effectif: IEffectifMissionLocale["effectif"] }) {
  const od = effectif.organisme_data;
  const prenom = effectif.prenom;

  const organismeName = effectif.organisme?.nom || effectif.organisme?.raison_sociale || "";

  const commentaires = od?.commentaires_par_motif;

  const motifs = od?.motif || [];
  const freinsMotifs = motifs.filter(
    (m) => m !== ACC_CONJOINT_MOTIF_ENUM.RECHERCHE_EMPLOI && m !== ACC_CONJOINT_MOTIF_ENUM.REORIENTATION
  );
  const hasRecherche = motifs.includes(ACC_CONJOINT_MOTIF_ENUM.RECHERCHE_EMPLOI);
  const hasReorientation = motifs.includes(ACC_CONJOINT_MOTIF_ENUM.REORIENTATION);

  return (
    <>
      <div className={styles.sentHeader}>
        <span className={styles.sentHeaderTitle}>Collaboration avec le CFA</span>
      </div>

      <div className={styles.sentBubble}>
        {od?.still_at_cfa != null && (
          <div className={styles.sentBubbleSection}>
            <p className={styles.sentStillAtCfa}>
              {prenom} {od.still_at_cfa ? "est maintenu en formation dans le CFA ✅" : "n'est plus en formation au CFA"}
            </p>
          </div>
        )}

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

        {od?.note_complementaire && (
          <div className={styles.sentBubbleSection}>
            <p className={styles.sentSectionTitle}>Note complémentaire</p>
            <p className={styles.sentBody}>{od.note_complementaire}</p>
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
      </div>

      {od?.reponse_at && (
        <div className={styles.sentFooter}>
          <span className={`fr-icon-send-plane-fill fr-icon--sm ${styles.sentBadgeIcon}`} aria-hidden="true" />
          <span>
            Dossier envoyé par le CFA{organismeName ? ` ${organismeName}` : ""}
            {effectif.contact_cfa && ` par ${effectif.contact_cfa.prenom} ${effectif.contact_cfa.nom}`}{" "}
            <span className={styles.sentFooterDate}>le {formatDate(od.reponse_at)}</span>
          </span>
        </div>
      )}
    </>
  );
}
