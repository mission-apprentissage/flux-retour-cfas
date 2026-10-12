"use client";

import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { useMissionLocaleDetail, type IMissionLocaleDetailResponse } from "../hooks/useStatsQueries";
import { ExportAllButton } from "../sections/ExportAllButton";
import { StatsErrorHandler } from "../ui/StatsErrorHandler";
import { StatsTabs, type StatsTab } from "../ui/StatsTabs";
import { formatDateCourte } from "../utils";

import styles from "./FicheDetailView.module.css";
import { FicheEntete } from "./FicheEntete";
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

  // Next ne remonte pas toujours en haut en arrivant depuis un tableau défilé (fiche déjà en cache).
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [mlId]);

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
          <FicheEntete
            parent={parent}
            titre={data.ml.nom}
            statuts={mlStatuts(data)}
            imposture={
              isAdmin
                ? {
                    corps: { type: "MISSION_LOCALE", ml_id: data.ml.ml_id, nom: data.ml.nom },
                    redirection: "/mission-locale",
                    desactivee: !isActive,
                  }
                : undefined
            }
          />

          <MlAlertesActivite alertes={data.indicateurs.alertes} />

          <StatsTabs className={styles.tabs} tabs={buildTabs(mlId, data, isAdmin)} />
        </>
      )}
    </StatsErrorHandler>
  );
}

function mlStatuts(data: IMissionLocaleDetailResponse) {
  const { is_engaged, taux_traitement, derniere_connexion_at } = data.indicateurs;
  const engagement = `ML engagée ${is_engaged ? "oui" : "non"}${
    taux_traitement === null ? "" : ` - taux de traitement ${taux_traitement} %`
  }`;

  return [
    <Badge key="compte" as="span" severity={data.is_active ? "success" : "error"} small>
      {data.is_active ? "A un compte" : "N'a pas de compte"}
    </Badge>,
    <Badge key="engagement" as="span" severity={is_engaged ? "success" : "error"} small>
      {engagement}
    </Badge>,
    <span key="connexion">
      {derniere_connexion_at ? `Dernière connexion le ${formatDateCourte(derniere_connexion_at)}` : "Aucune connexion"}
    </span>,
  ];
}

function buildParentLink(currentParams = "") {
  const params = new URLSearchParams(currentParams);

  if (params.get("from") === "recherche") {
    const recherche = new URLSearchParams();
    const q = params.get("q");
    if (q) recherche.set("q", q);
    return { label: "Recherche", href: `/suivi-des-indicateurs/recherche?${recherche.toString()}` };
  }
  [...params.keys()]
    .filter((key) => ["from", "tab", "q"].includes(key) || key.startsWith("collab_"))
    .forEach((key) => params.delete(key));
  params.set("tab", "deploiement");
  return { label: "Missions Locales", href: `/suivi-des-indicateurs/mission-locale?${params.toString()}` };
}

function buildTabs(mlId: string, data: IMissionLocaleDetailResponse, isAdmin: boolean): StatsTab[] {
  const isActive = data.is_active;

  return [
    { id: "infos", label: "Infos et coordonnées", content: <MLInfosTab mlId={mlId} data={data} isAdmin={isAdmin} /> },
    ...(data.peut_voir_nominatif
      ? [{ id: "equipe", label: "Équipe", content: <MLEquipeTab mlId={mlId} isAdmin={isAdmin} /> }]
      : []),
    {
      id: "ruptures",
      label: "Suivi des ruptures",
      content: isActive ? (
        <MLSuiviTraitementTab
          mlId={mlId}
          action={
            <ExportAllButton
              mlId={mlId}
              mlNom={data.ml.nom}
              label="Exporter les données de cette Mission Locale"
              priority="secondary"
            />
          }
        />
      ) : (
        <MLSuiviTraitementTab mlId={mlId} noData />
      ),
    },
    {
      id: "collaborations",
      label: "Suivi des collaborations",
      content: (
        <MLCollaborationsTab
          mlId={mlId}
          listeAutorisee={data.peut_voir_nominatif}
          action={
            <ExportAllButton
              mlId={mlId}
              mlNom={data.ml.nom}
              label="Exporter les données de cette Mission Locale"
              priority="secondary"
            />
          }
        />
      ),
    },
  ];
}
