"use client";

import { useParams, useSearchParams } from "next/navigation";
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
  isATraiter,
}: {
  previous?: { id: string };
  next?: { id: string };
  total?: number;
  currentIndex: number;
  isLoading?: boolean;
  isATraiter?: boolean;
}) {
  const params = useParams();
  const mlId = params?.id;
  const effectifId = params && "effectifId" in params ? params.effectifId : undefined;
  const searchParams = useSearchParams();
  const rawList = searchParams ? (searchParams.get("nom_liste") as API_EFFECTIF_LISTE | null) : null;
  const nomListe = rawList || API_EFFECTIF_LISTE.A_TRAITER;
  const listQuery = `?nom_liste=${nomListe}`;

  const basePath = effectifId ? `/admin/mission-locale/${mlId}` : `/mission-locale`;

  const getHref = (id: string) => `${basePath}/${id}${listQuery}`;

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
              {nomListe === API_EFFECTIF_LISTE.PRIORITAIRE ? (
                <p className={styles.pageHeaderText}>
                  Dossier n°{currentIndex + 1} sur {total} à traiter en priorité
                </p>
              ) : nomListe === API_EFFECTIF_LISTE.INJOIGNABLE ? (
                <p className={styles.pageHeaderText}>
                  Dossier n°{currentIndex + 1} sur {total} injoignable
                </p>
              ) : (
                <p className={styles.pageHeaderText}>
                  Dossier n°{currentIndex + 1} sur {total} {isATraiter ? "encore à traiter" : "traité"}
                </p>
              )}
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
