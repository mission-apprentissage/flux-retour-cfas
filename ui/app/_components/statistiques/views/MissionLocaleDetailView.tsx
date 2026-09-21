"use client";

import Alert from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { _post } from "@/common/httpClient";

import { useMissionLocaleDetail } from "../hooks/useStatsQueries";
import { useTraitementExport } from "../hooks/useTraitementExport";
import { NO_DATA_ML_MESSAGE } from "../ui/NoDataMessage";
import { StatsErrorHandler } from "../ui/StatsErrorHandler";
import { StatsTabs, type StatsTab } from "../ui/StatsTabs";
import { formatDateFr } from "../utils";

import styles from "./MissionLocaleDetailView.module.css";
import { MlAdminRdvUrlEditor } from "./MlAdminRdvUrlEditor";
import { MLCollaborationsTab } from "./tabs/MLCollaborationsTab";
import { MLEquipeTab } from "./tabs/MLEquipeTab";
import { MLSuiviTraitementTab } from "./tabs/MLSuiviTraitementTab";

interface MissionLocaleDetailViewProps {
  mlId: string;
  isAdmin?: boolean;
}

export function MissionLocaleDetailView({ mlId, isAdmin = false }: MissionLocaleDetailViewProps) {
  const searchParams = useSearchParams();
  const { data, isLoading, error } = useMissionLocaleDetail(mlId);
  const isActive = data?.is_active === true;
  const [exportError, setExportError] = useState<string | null>(null);
  const { exportData, isExporting } = useTraitementExport({
    mlId,
    mlNom: data?.ml?.nom,
    onError: (err) => setExportError(err.message),
    onSuccess: () => setExportError(null),
  });

  const handleImpersonate = async () => {
    if (!data?.ml) return;
    await _post("/api/v1/admin/impersonate", {
      type: "MISSION_LOCALE",
      ml_id: data.ml.ml_id,
      nom: data.ml.nom,
    });
    window.location.href = "/mission-locale";
  };

  const buildBackUrl = () => {
    const params = new URLSearchParams();
    const page = searchParams?.get("page");
    const limit = searchParams?.get("limit");
    const sort_by = searchParams?.get("sort_by");
    const sort_order = searchParams?.get("sort_order");
    const search = searchParams?.get("search");

    if (page) params.set("page", page);
    if (limit) params.set("limit", limit);
    if (sort_by) params.set("sort_by", sort_by);
    if (sort_order) params.set("sort_order", sort_order);
    if (search) params.set("search", search);

    const queryString = params.toString();
    return `/suivi-des-indicateurs/mission-locale${queryString ? `?${queryString}` : ""}`;
  };

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
      <Link href={buildBackUrl()} className="fr-link fr-link--sm">
        <i className="fr-icon-arrow-left-line fr-icon--sm" aria-hidden="true" />
        Revenir à la liste des Missions Locales
      </Link>

      <div className={styles.pageLayout}>
        <div className={styles.mainContent}>
          <div className={styles.headerContainer}>
            <div className={styles.iconContainer}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M23 18.9999H22V8.99991H18V6.58569L12 0.585693L6 6.58569V8.99991H2V18.9999H1V20.9999H23V18.9999ZM6 19H4V11H6V19ZM18 11H20V19H18V11ZM11 12H13V19H11V12Z"
                  fill="#6A6AF4"
                />
              </svg>
            </div>

            <h1 className={styles.title}>Mission Locale : {data?.ml?.nom || "—"}</h1>
          </div>

          {!isActive ? (
            <div className={styles.warningBanner}>
              <span className="fr-icon-info-fill" aria-hidden="true" />
              <span>{NO_DATA_ML_MESSAGE}</span>
            </div>
          ) : (
            data?.has_cfa_collaboration && (
              <span className={styles.cfaBadge}>
                <span className={styles.cfaBadgeIcon}>
                  <i className="fr-icon-check-line fr-icon--sm" aria-hidden="true" />
                </span>
                En collaboration avec des CFA partenaires
              </span>
            )
          )}

          {data && (
            <div className={styles.tabsContainer}>
              <StatsTabs tabs={buildTabs(mlId, isActive)} />
            </div>
          )}
        </div>

        <aside className={styles.sidebar}>
          {isAdmin && (
            <Button
              iconId="ri-user-follow-line"
              priority="primary"
              onClick={handleImpersonate}
              className={styles.sidebarButton}
              disabled={!isActive}
            >
              Voir le suivi des jeunes
            </Button>
          )}

          {isActive && (
            <Button
              iconId="fr-icon-download-line"
              iconPosition="right"
              priority="secondary"
              onClick={exportData}
              disabled={isExporting}
              className={styles.sidebarButton}
            >
              {isExporting ? "Export en cours..." : "Exporter les données de cette Mission Locale"}
            </Button>
          )}
          {exportError && (
            <Alert severity="error" small description={exportError} closable onClose={() => setExportError(null)} />
          )}

          <div className={styles.aboutBox}>
            <h2 className={styles.sidebarTitle}>À propos</h2>
            <div className={styles.infoList}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>SIRET</span>
                <span className={styles.infoValue}>{data?.ml?.siret || "—"}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Adresse</span>
                <span className={styles.infoValue}>
                  {data?.ml?.adresse
                    ? `${data.ml.adresse.commune || ""} ${data.ml.adresse.code_postal || ""}`.trim() || "—"
                    : "—"}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Courriel</span>
                <span className={styles.infoValue}>{data?.ml?.email || "—"}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Site internet</span>
                <span className={styles.infoValue}>
                  {data?.ml?.site_web ? (
                    <a href={data.ml.site_web} target="_blank" rel="noopener noreferrer" className="fr-link">
                      {data.ml.site_web}
                    </a>
                  ) : (
                    "—"
                  )}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Téléphone</span>
                <span className={styles.infoValue}>{data?.ml?.telephone || "—"}</span>
              </div>
              {isAdmin && data?.ml && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Lien RDV</span>
                  <span className={styles.infoValue}>
                    <MlAdminRdvUrlEditor mlId={mlId} rdvUrl={data.ml.rdv_url} />
                  </span>
                </div>
              )}
            </div>

            {!isActive ? (
              <div className={styles.sidebarWarningBanner}>
                <span className="fr-icon-info-fill" aria-hidden="true" />
                <span>{NO_DATA_ML_MESSAGE}</span>
              </div>
            ) : (
              <div className={styles.activityBox}>
                {data?.activated_at && (
                  <div className={styles.aboutItem}>
                    <i className="fr-icon-calendar-line fr-icon--sm" aria-hidden="true" />
                    <span>Activée le {formatDateFr(data.activated_at)}</span>
                  </div>
                )}
                {data?.last_activity_at && (
                  <div className={styles.aboutItem}>
                    <i className="fr-icon-time-line fr-icon--sm" aria-hidden="true" />
                    <span>Dernière activité le {formatDateFr(data.last_activity_at)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>
    </StatsErrorHandler>
  );
}

function buildTabs(mlId: string, isActive: boolean): StatsTab[] {
  if (!isActive) {
    return [
      { id: "ruptures", label: "Suivi traitement", content: <MLSuiviTraitementTab mlId={mlId} noData /> },
      { id: "equipe", label: "Équipe", content: <MLEquipeTab mlId={mlId} noData /> },
    ];
  }

  return [
    { id: "ruptures", label: "Suivi traitement ruptures", content: <MLSuiviTraitementTab mlId={mlId} /> },
    { id: "collaborations", label: "Suivi traitement collaborations", content: <MLCollaborationsTab mlId={mlId} /> },
    { id: "equipe", label: "Équipe", content: <MLEquipeTab mlId={mlId} /> },
  ];
}
