"use client";

import { Spinner } from "@/app/_components/common/Spinner";
import { DsfrLink } from "@/app/_components/link/DsfrLink";
import { usePlausibleAppTracking } from "@/app/_hooks/plausible";

import styles from "./FTEffectifPageHeader.module.css";

interface FTEffectifPageHeaderProps {
  previous?: { id: string; nom: string; prenom: string } | null;
  next?: { id: string; nom: string; prenom: string } | null;
  total?: number;
  currentIndex?: number | null;
  isLoading?: boolean;
  codeSecteur?: number;
  buildQueryString: (includePageLimit?: boolean) => string;
}

export function FTEffectifPageHeader({
  previous,
  next,
  total,
  currentIndex,
  isLoading,
  codeSecteur,
  buildQueryString,
}: FTEffectifPageHeaderProps) {
  const { trackPlausibleEvent } = usePlausibleAppTracking();

  const getHref = (id: string) => {
    const query = buildQueryString(false);
    if (codeSecteur) {
      return `/france-travail/${codeSecteur}/effectif/${id}${query ? `?${query}` : ""}`;
    }
    return `/france-travail/deja-traites/effectif/${id}${query ? `?${query}` : ""}`;
  };

  return (
    <div className={styles.pageHeaderContainer}>
      {previous ? (
        <DsfrLink
          href={getHref(previous.id)}
          arrow="none"
          className="fr-link--icon-left fr-icon-arrow-left-s-line"
          aria-label={`Effectif précédent : ${previous.nom} ${previous.prenom}`}
          onClick={() => {
            trackPlausibleEvent("isc_navigation_precedent");
          }}
        >
          Précédent
        </DsfrLink>
      ) : (
        <div />
      )}

      <div className={styles.pageHeaderCenter}>
        {!isLoading && total != null && currentIndex != null ? (
          <>
            <div className={styles.pageHeaderDesktopText}>
              <p className={styles.pageHeaderText}>
                Dossier n°{currentIndex + 1} sur {total} {codeSecteur ? "à traiter" : "traité"}
              </p>
            </div>

            <div className={styles.pageHeaderMobileText}>
              <p className={styles.pageHeaderText}>
                {currentIndex + 1}/{total}
              </p>
            </div>
          </>
        ) : (
          <Spinner size="20px" color="var(--text-action-high-blue-france)" />
        )}
      </div>

      {next ? (
        <DsfrLink
          href={getHref(next.id)}
          arrow="none"
          className="fr-link--icon-right fr-icon-arrow-right-s-line"
          aria-label={`Effectif suivant : ${next.nom} ${next.prenom}`}
          onClick={() => {
            trackPlausibleEvent("isc_navigation_suivant");
          }}
        >
          Suivant
        </DsfrLink>
      ) : (
        <div />
      )}
    </div>
  );
}
