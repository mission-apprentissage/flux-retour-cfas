"use client";

import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Tag } from "@codegouvfr/react-dsfr/Tag";
import { format } from "date-fns/format";
import { ML_SITUATION_DOSSIER_LABEL } from "shared/constants/missionLocale";
import type { ICollaborationDossier, ICollaborationDossierStructure } from "shared/models/data/nationalStats.model";

import { DOSSIERS_TRAITES_V2_LABELS } from "../constants";
import { motifLabel } from "../hooks/useCollabDossiersExport";
import { COLLAB_DOSSIER_STATUT_LABELS } from "../hooks/useStatsQueries";

import styles from "./CollaborationsListCard.module.css";

const STATUT_SEVERITY = { a_traiter: "info", a_recontacter: "warning", traite: "success" } as const;

const structureLabel = ({ nom, commune }: ICollaborationDossierStructure) =>
  [nom ?? "Nom inconnu", commune].filter(Boolean).join(", ");

export function CollaborationDossierItem({ dossier }: { dossier: ICollaborationDossier }) {
  const situation = dossier.situation
    ? (ML_SITUATION_DOSSIER_LABEL[dossier.situation as keyof typeof ML_SITUATION_DOSSIER_LABEL] ?? dossier.situation)
    : null;

  return (
    <li className={styles.item}>
      <p className={styles.jeune}>
        {dossier.jeune.prenom} <strong>{dossier.jeune.nom}</strong>
      </p>
      <p className={styles.structure}>
        <span>ML</span>
        <strong>{structureLabel(dossier.mission_locale)}</strong>
      </p>
      <p className={styles.structure}>
        <span>CFA</span>
        <strong>{structureLabel(dossier.cfa)}</strong>
      </p>
      <dl className={styles.details}>
        <dt>Statut</dt>
        <dd>
          <Badge as="span" small severity={STATUT_SEVERITY[dossier.statut]}>
            {COLLAB_DOSSIER_STATUT_LABELS[dossier.statut]}
          </Badge>
        </dd>
        <dt>Situation</dt>
        <dd>{situation ? <Tag small>{situation}</Tag> : "-"}</dd>
        <dt>Objectif(s) d&apos;accompagnement</dt>
        <dd>
          {dossier.motifs.length
            ? dossier.motifs.map((motif) => (
                <Tag key={motif} small>
                  {motifLabel(motif)}
                </Tag>
              ))
            : "-"}
        </dd>
        <dt>Résultat traitement ML</dt>
        <dd>
          {dossier.resultat ? (
            <Badge as="span" small noIcon severity="success">
              {DOSSIERS_TRAITES_V2_LABELS[dossier.resultat]}
            </Badge>
          ) : (
            <Badge as="span" small severity="new">
              À traiter
            </Badge>
          )}
        </dd>
      </dl>
      <p className={styles.footer}>
        <span>Date d&apos;envoi</span> <strong>{format(new Date(dossier.date_envoi), "dd/MM/yyyy")}</strong>
        {" • "}
        <span>Délai de traitement ML</span>{" "}
        <strong>
          {dossier.delai_jours} j{dossier.traite_par_ml ? "" : " (pas encore traité par la ML)"}
        </strong>
      </p>
    </li>
  );
}
