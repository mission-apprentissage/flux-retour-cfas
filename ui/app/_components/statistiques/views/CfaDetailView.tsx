"use client";

import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { useCfaFiche, type ICfaFicheResponse } from "../hooks/useStatsQueries";
import { StatsErrorHandler } from "../ui/StatsErrorHandler";
import { StatsTabs, type StatsTab } from "../ui/StatsTabs";
import { formatDateCourte } from "../utils";

import { AlertesActivite } from "./AlertesActivite";
import styles from "./FicheDetailView.module.css";
import { FicheEntete } from "./FicheEntete";
import { CfaInfosTab } from "./tabs/CfaInfosTab";

interface CfaDetailViewProps {
  organismeId: string;
  isAdmin?: boolean;
}

export function CfaDetailView({ organismeId, isAdmin = false }: CfaDetailViewProps) {
  const searchParams = useSearchParams();
  const { data, isLoading, error } = useCfaFiche(organismeId);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [organismeId]);

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
            parent={buildParentLink(searchParams?.toString())}
            titre={data.nom ?? "Établissement sans nom"}
            statuts={cfaStatuts(data)}
            imposture={
              isAdmin
                ? { corps: { type: "ORGANISME_FORMATION", siret: data.siret, uai: data.uai }, redirection: "/" }
                : undefined
            }
          />
          <AlertesActivite
            alertes={data.alertes.map((alerte) => ({
              cle: alerte.type,
              contenu: (
                <>
                  Ce CFA a{" "}
                  <strong>
                    reçu {alerte.valeur} {alerte.valeur > 1 ? "invitations" : "invitation"} de la part de Missions
                    Locales
                  </strong>{" "}
                  pour utiliser le service
                </>
              ),
            }))}
          />
          <StatsTabs className={styles.tabs} tabs={buildTabs(data)} />
        </>
      )}
    </StatsErrorHandler>
  );
}

function cfaStatuts(data: ICfaFicheResponse) {
  const statuts = [
    <Badge key="compte" as="span" severity={data.has_account ? "success" : "error"} small>
      {data.has_account ? "A un compte" : "Pas de compte"}
    </Badge>,
    <Badge key="collab" as="span" severity={data.collabore ? "success" : "error"} small>
      {data.collabore ? "Collabore avec les ML" : "Pas de collaboration"}
    </Badge>,
  ];
  if (data.qualiopi) {
    statuts.push(
      <Badge key="qualiopi" as="span" severity="info" small>
        Qualiopi
      </Badge>
    );
  }
  statuts.push(
    <span key="connexion">
      {data.derniere_connexion_at
        ? `Dernière connexion le ${formatDateCourte(data.derniere_connexion_at)}`
        : "Aucune connexion"}
    </span>
  );
  return statuts;
}

const PROVENANCES: Record<string, { label: string; href: (params: URLSearchParams) => string }> = {
  recherche: {
    label: "Recherche",
    href: (params) =>
      `/suivi-des-indicateurs/recherche${params.get("q") ? `?q=${encodeURIComponent(params.get("q")!)}` : ""}`,
  },
  ml: {
    label: "Fiche Mission Locale",
    href: (params) => `/suivi-des-indicateurs/mission-locale/${params.get("ml_id")}?tab=collaborations`,
  },
  collaborations: { label: "Collaborations", href: () => "/suivi-des-indicateurs/collaborations" },
};

function buildParentLink(currentParams = "") {
  const params = new URLSearchParams(currentParams);
  const provenance = PROVENANCES[params.get("from") ?? ""];
  if (provenance && (params.get("from") !== "ml" || /^[0-9a-f]{24}$/.test(params.get("ml_id") ?? ""))) {
    return { label: provenance.label, href: provenance.href(params) };
  }
  return { label: "Établissements de formation et CFA", href: "/suivi-des-indicateurs/cfa" };
}

function buildTabs(data: ICfaFicheResponse): StatsTab[] {
  return [{ id: "infos", label: "Infos", iconId: "fr-icon-phone-line", content: <CfaInfosTab data={data} /> }];
}
