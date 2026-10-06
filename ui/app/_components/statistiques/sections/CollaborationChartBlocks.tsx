"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";
import type { ICollaborationSegmentStats } from "shared/models/data/nationalStats.model";

import { OverviewCard } from "../cards/OverviewCard";
import { DetailsDossiersTraitesPieChart } from "../charts/DetailsDossiersTraitesPieChart";
import { ObjectifsBarChart } from "../charts/ObjectifsBarChart";
import { SituationsPieChart } from "../charts/SituationsPieChart";

import styles from "./CollaborationSegmentPanel.module.css";

type BlockVariant = "panel" | "overview";

interface CollaborationBlockProps {
  data: ICollaborationSegmentStats;
  loading: boolean;
  loadingVariation?: boolean;
  variant?: BlockVariant;
  className?: string;
}

function ChartBlock({
  variant,
  title,
  tooltip,
  className,
  children,
}: {
  variant: BlockVariant;
  title: string;
  tooltip: string;
  className?: string;
  children: React.ReactNode;
}) {
  const heading = (
    <>
      {title} <Tooltip kind="hover" title={tooltip} />
    </>
  );

  if (variant === "overview") return <OverviewCard title={heading}>{children}</OverviewCard>;

  return (
    <div className={`${styles.chartCard} ${className ?? ""}`}>
      <h3 className={fr.cx("fr-h6", "fr-mb-2w")}>{heading}</h3>
      {children}
    </div>
  );
}

export function CollabResultatsBlock({
  data,
  loading,
  loadingVariation,
  variant = "panel",
  className,
}: CollaborationBlockProps) {
  return (
    <ChartBlock
      variant={variant}
      className={className}
      title="Dossiers de collaboration traités"
      tooltip="Répartition des dossiers de collaboration selon la situation renseignée par la Mission Locale. Un dossier est traité dès qu'une situation est renseignée, y compris « à recontacter »."
    >
      <DetailsDossiersTraitesPieChart data={data.resultats} loading={loading} loadingVariation={loadingVariation} />
      <div className={styles.encarts}>
        <div className={styles.encart}>
          <span className={styles.encartLabel}>
            Part de jeunes déjà connus des Missions Locales dans les dossiers traités{" "}
            <Tooltip
              kind="hover"
              title="Parmi les dossiers de collaboration traités, part des jeunes que la Mission Locale a déclarés déjà connus et accompagnés."
            />
          </span>
          <strong className={styles.encartValue}>{data.part_deja_connus} %</strong>
        </div>
        <div className={styles.encart}>
          <span className={styles.encartLabel}>
            Délai moyen de traitement par les Missions Locales{" "}
            <Tooltip
              kind="hover"
              title="Nombre moyen de jours entre l'envoi de la collaboration par le CFA et la première action d'un conseiller de la Mission Locale sur le dossier."
            />
          </span>
          <strong className={styles.encartValue}>
            {data.delai_moyen_jours === null
              ? "—"
              : `${data.delai_moyen_jours.toLocaleString("fr-FR")} ${data.delai_moyen_jours > 1 ? "jours" : "jour"}`}
          </strong>
        </div>
      </div>
    </ChartBlock>
  );
}

export function CollabSituationsBlock({ data, loading, variant = "panel", className }: CollaborationBlockProps) {
  return (
    <ChartBlock
      variant={variant}
      className={className}
      title="La situation du jeune lorsqu'il est envoyé par le CFA"
      tooltip="Situation du jeune telle que qualifiée par le CFA au moment de l'envoi de la collaboration : rupture, abandon, risque de rupture selon trois niveaux, ou besoin d'aide sans rupture."
    >
      <SituationsPieChart
        data={data.situations}
        variations={variant === "overview" ? data.situations_variations : undefined}
        loading={loading}
      />
    </ChartBlock>
  );
}

export function CollabObjectifsBlock({ data, loading, variant = "panel", className }: CollaborationBlockProps) {
  return (
    <ChartBlock
      variant={variant}
      className={className}
      title="Les objectifs d'accompagnement sélectionnés par les CFA"
      tooltip="Objectifs cochés par le CFA lors de l'envoi de la collaboration, chaque barre étant rapportée au total des dossiers envoyés."
    >
      <p className={fr.cx("fr-text--sm", "fr-mb-2w")}>
        Les objectifs d&apos;accompagnement sont cumulatifs : pour un même dossier de jeune, le CFA peut sélectionner
        plusieurs objectifs d&apos;accompagnement par la Mission Locale.
      </p>
      <ObjectifsBarChart data={data.objectifs} loading={loading} />
    </ChartBlock>
  );
}
