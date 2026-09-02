"use client";

import { ACC_CONJOINT_MOTIF_ENUM, IEffectifMissionLocale } from "shared";

import { MOTIF_EMOJIS, MOTIF_LABELS } from "@/app/_components/ruptures/shared/constants";
import { formatDate } from "@/app/_utils/date.utils";

import { DossierSituationBlock } from "../../shared/collaboration/DossierSituationBlock";
import { ReferentCoordonnees } from "../../shared/collaboration/ReferentCoordonnees";
import { ResponsableLegalBlock } from "../../shared/collaboration/ResponsableLegalBlock";
import { withSharedStyles } from "../../shared/collaboration/withSharedStyles";

import localStyles from "./MlCollaborationDetail.module.css";

const styles = withSharedStyles(localStyles);

export function CollaborationReceivedView({ effectif }: { effectif: IEffectifMissionLocale["effectif"] }) {
  const od = effectif.organisme_data;

  const organismeName = effectif.organisme?.nom || effectif.organisme?.raison_sociale || "";

  const commentaires = od?.commentaires_par_motif;

  const motifs = od?.motif || [];
  const freinsMotifs = motifs.filter(
    (m) => m !== ACC_CONJOINT_MOTIF_ENUM.RECHERCHE_EMPLOI && m !== ACC_CONJOINT_MOTIF_ENUM.REORIENTATION
  );
  const hasRecherche = motifs.includes(ACC_CONJOINT_MOTIF_ENUM.RECHERCHE_EMPLOI);
  const hasReorientation = motifs.includes(ACC_CONJOINT_MOTIF_ENUM.REORIENTATION);

  const motifCommentaire = (motif: ACC_CONJOINT_MOTIF_ENUM) =>
    commentaires?.[motif] ? <span className={styles.sentMotifComment}> {commentaires[motif]}</span> : null;

  return (
    <>
      <div className={styles.sentHeader}>
        <span className={styles.sentHeaderTitle}>Collaboration avec le CFA</span>
      </div>

      <div className={styles.sentBubble}>
        <DossierSituationBlock
          organismeData={od}
          dateRupture={effectif.date_rupture}
          situationDossier={effectif.situation_dossier}
        />

        {motifs.length > 0 && (
          <div className={styles.sentBubbleSection}>
            <p className={styles.sentSectionTitle}>Objectif de l&apos;accompagnement</p>

            {hasRecherche && (
              <p className={styles.sentMotifInline}>
                <strong>
                  L&apos;aider dans sa recherche d&apos;entreprise{" "}
                  {MOTIF_EMOJIS[ACC_CONJOINT_MOTIF_ENUM.RECHERCHE_EMPLOI]}
                </strong>
                {motifCommentaire(ACC_CONJOINT_MOTIF_ENUM.RECHERCHE_EMPLOI)}
              </p>
            )}

            {freinsMotifs.map((motif) => (
              <p key={motif} className={styles.sentMotifInline}>
                <strong>
                  Frein de {MOTIF_LABELS[motif] || motif} {MOTIF_EMOJIS[motif] || ""}
                </strong>
                {motifCommentaire(motif)}
              </p>
            ))}

            {hasReorientation && (
              <p className={styles.sentMotifInline}>
                <strong>Réorientation {MOTIF_EMOJIS[ACC_CONJOINT_MOTIF_ENUM.REORIENTATION]}</strong>
                {motifCommentaire(ACC_CONJOINT_MOTIF_ENUM.REORIENTATION)}
              </p>
            )}
          </div>
        )}

        <ResponsableLegalBlock organismeData={od} dateDeNaissance={effectif.date_de_naissance} />

        {od?.referent_coordonnees && (
          <div className={styles.sentBubbleSection}>
            <p className={styles.sentSectionTitle}>Référent(es) au CFA à contacter</p>
            <ReferentCoordonnees value={od.referent_coordonnees} />
          </div>
        )}

        {od?.note_complementaire && (
          <div className={styles.sentBubbleSection}>
            <p className={styles.sentSectionTitle}>Message</p>
            <p className={styles.sentBody}>{od.note_complementaire}</p>
          </div>
        )}
      </div>

      {od?.reponse_at && (
        <div className={styles.sentFooter}>
          <span className={`fr-icon-send-plane-fill fr-icon--sm ${styles.sentBadgeIcon}`} aria-hidden="true" />
          <span className={styles.sentFooterLabel}>
            Dossier envoyé par le CFA{organismeName ? ` ${organismeName}` : ""}
            {effectif.contact_cfa && `, par ${effectif.contact_cfa.prenom} ${effectif.contact_cfa.nom}`}
          </span>
          <span className={styles.sentFooterDate}>{formatDate(od.reponse_at)}</span>
        </div>
      )}
    </>
  );
}
