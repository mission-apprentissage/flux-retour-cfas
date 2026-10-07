"use client";

import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Breadcrumb } from "@codegouvfr/react-dsfr/Breadcrumb";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { useSearchParams } from "next/navigation";

import { _post } from "@/common/httpClient";

import { useMissionLocaleDetail, type IMissionLocaleDetailResponse } from "../hooks/useStatsQueries";
import { ExportAllButton } from "../sections/ExportAllButton";
import { StatsErrorHandler } from "../ui/StatsErrorHandler";
import { StatsTabs, type StatsTab } from "../ui/StatsTabs";
import { formatDateCourte } from "../utils";

import styles from "./MissionLocaleDetailView.module.css";
import { MlAlertesActivite } from "./MlAlertesActivite";
import { MLCollaborationsTab } from "./tabs/MLCollaborationsTab";
import { MLEquipeTab } from "./tabs/MLEquipeTab";
import { MLInfosTab } from "./tabs/MLInfosTab";
import { MLSuiviTraitementTab } from "./tabs/MLSuiviTraitementTab";

interface MissionLocaleDetailViewProps {
  mlId: string;
  isAdmin?: boolean;
}

export function MissionLocaleDetailView({ mlId, isAdmin = false }: MissionLocaleDetailViewProps) {
  const searchParams = useSearchParams();
  const { data, isLoading, error } = useMissionLocaleDetail(mlId);
  const isActive = data?.is_active === true;

  const handleImpersonate = async () => {
    if (!data?.ml) return;
    await _post("/api/v1/admin/impersonate", {
      type: "MISSION_LOCALE",
      ml_id: data.ml.ml_id,
      nom: data.ml.nom,
    });
    window.location.href = "/mission-locale";
  };

  const parent = buildParentLink(searchParams?.toString());

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.headerSkeleton} />
        <div className={styles.headerSkeleton} />
      </div>
    );
  }

  return (
    <StatsErrorHandler data={data} error={error} isLoading={isLoading}>
      {data && (
        <>
          <Breadcrumb
            className={styles.breadcrumb}
            currentPageLabel={data.ml.nom}
            segments={[{ label: parent.label, linkProps: { href: parent.href } }]}
          />

          <header className={styles.header}>
            <div className={styles.titleRow}>
              <span className={`fr-icon-map-pin-user-line ${styles.titleIcon}`} aria-hidden="true" />
              <h1 className={styles.title}>{data.ml.nom}</h1>
              {isAdmin && (
                <Button
                  priority="secondary"
                  iconId="fr-icon-eye-line"
                  iconPosition="right"
                  onClick={handleImpersonate}
                  disabled={!isActive}
                  className={styles.imposture}
                >
                  Imposture
                </Button>
              )}
            </div>
            <MlStatutLigne data={data} />
          </header>

          <MlAlertesActivite alertes={data.indicateurs.alertes} />

          <StatsTabs className={styles.tabs} tabs={buildTabs(mlId, data, isAdmin)} />
        </>
      )}
    </StatsErrorHandler>
  );
}

function MlStatutLigne({ data }: { data: IMissionLocaleDetailResponse }) {
  const { is_engaged, taux_traitement, derniere_connexion_at } = data.indicateurs;
  const engagement = `ML engagée ${is_engaged ? "oui" : "non"}${
    taux_traitement === null ? "" : ` - taux de traitement ${taux_traitement} %`
  }`;

  return (
    <p className={styles.statuts}>
      <Badge as="span" severity={data.is_active ? "success" : "error"} small>
        {data.is_active ? "A un compte" : "N'a pas de compte"}
      </Badge>
      <span aria-hidden="true">•</span>
      <Badge as="span" severity={is_engaged ? "success" : "error"} small>
        {engagement}
      </Badge>
      <span aria-hidden="true">•</span>
      <span>
        {derniere_connexion_at
          ? `Dernière connexion le ${formatDateCourte(derniere_connexion_at)}`
          : "Aucune connexion"}
      </span>
    </p>
  );
}

const FICHE_PARAMS = ["from", "tab"];

function buildParentLink(currentParams = "") {
  const params = new URLSearchParams(currentParams);
  const fromRecherche = params.get("from") === "recherche";
  FICHE_PARAMS.forEach((key) => params.delete(key));

  if (fromRecherche) {
    return { label: "Recherche", href: `/suivi-des-indicateurs/recherche?${params.toString()}` };
  }
  params.set("tab", "deploiement");
  return { label: "Missions Locales", href: `/suivi-des-indicateurs/mission-locale?${params.toString()}` };
}

function buildTabs(mlId: string, data: IMissionLocaleDetailResponse, isAdmin: boolean): StatsTab[] {
  const isActive = data.is_active;

  return [
    { id: "infos", label: "Infos et coordonnées", content: <MLInfosTab mlId={mlId} data={data} isAdmin={isAdmin} /> },
    { id: "equipe", label: "Équipe", content: <MLEquipeTab mlId={mlId} isAdmin={isAdmin} /> },
    {
      id: "ruptures",
      label: "Suivi des ruptures",
      content: isActive ? (
        <MLSuiviTraitementTab
          mlId={mlId}
          action={
            <ExportAllButton mlId={mlId} mlNom={data.ml.nom} label="Exporter les données de cette Mission Locale" />
          }
        />
      ) : (
        <MLSuiviTraitementTab mlId={mlId} noData />
      ),
    },
    { id: "collaborations", label: "Suivi des collaborations", content: <MLCollaborationsTab mlId={mlId} /> },
  ];
}
