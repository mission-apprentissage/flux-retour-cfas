"use client";

import { useParams, usePathname, useSearchParams } from "next/navigation";
import { API_EFFECTIF_LISTE } from "shared";

import { Spinner } from "@/app/_components/common/Spinner";
import { DsfrLink } from "@/app/_components/link/DsfrLink";

import styles from "./PageHeader.module.css";

export function PageHeader({
  previous,
  next,
  total,
  currentIndex,
  isLoading,
}: {
  previous?: { id: string };
  next?: { id: string };
  total?: number;
  currentIndex: number;
  isLoading?: boolean;
  isATraiter?: boolean;
}) {
  const params = useParams();
  const pathname = usePathname();
  const mlId = params?.id;
  const effectifId = params && "effectifId" in params ? params.effectifId : undefined;
  const searchParams = useSearchParams();
  const rawList = searchParams ? (searchParams.get("nom_liste") as API_EFFECTIF_LISTE | null) : null;
  const nomListe = rawList || API_EFFECTIF_LISTE.A_TRAITER;
  const listQuery = `?nom_liste=${nomListe}`;

  const basePath = (() => {
    if (pathname && pathname.startsWith("/cfa")) {
      return `/cfa`;
    }
    return effectifId ? `/admin/mission-locale/${mlId}/edit` : `/mission-locale`;
  })();

  const getHref = (id: string) => `${basePath}/${id}${listQuery}`;

  const getListeHeader = (list: API_EFFECTIF_LISTE) => {
    switch (list) {
      case API_EFFECTIF_LISTE.PRIORITAIRE:
        return "à traiter en priorité";
      case API_EFFECTIF_LISTE.INJOIGNABLE:
        return "à recontacter";
      case API_EFFECTIF_LISTE.TRAITE:
        return "traité";
      case API_EFFECTIF_LISTE.A_TRAITER:
        return "à traiter";
      case API_EFFECTIF_LISTE.INJOIGNABLE_PRIORITAIRE:
        return "à recontacter en priorité";
      case API_EFFECTIF_LISTE.TRAITE_PRIORITAIRE:
        return "traité en priorité";
      case API_EFFECTIF_LISTE.A_TRAITER_PRIORITAIRE:
        return "à traiter en priorité";
      default:
        return "";
    }
  };

  return (
    <div className={styles.pageHeaderContainer}>
      {previous ? (
        <DsfrLink href={getHref(previous.id)} arrow="none" className="fr-link--icon-left fr-icon-arrow-left-s-line">
          Précédent
        </DsfrLink>
      ) : (
        <div />
      )}

      <div className={styles.pageHeaderCenter}>
        {!isLoading && total !== undefined ? (
          <>
            <div className={styles.pageHeaderDesktopText}>
              <p className={styles.pageHeaderText}>
                Dossier n°{currentIndex + 1} sur {total} {getListeHeader(nomListe)}
              </p>
              <span className={styles.pageHeaderSubtext}>(tous mois confondus)</span>
            </div>

            <div className={styles.pageHeaderMobileText}>
              <p className={styles.pageHeaderText}>
                {currentIndex + 1}/{total}
              </p>
            </div>
          </>
        ) : (
          <div className={styles.pageHeaderCenter}>
            <Spinner size="20px" color="var(--text-action-high-blue-france)" />
          </div>
        )}
      </div>

      {next ? (
        <DsfrLink href={getHref(next.id)} arrow="none" className="fr-link--icon-right fr-icon-arrow-right-s-line">
          Suivant
        </DsfrLink>
      ) : (
        <div />
      )}
    </div>
  );
}
