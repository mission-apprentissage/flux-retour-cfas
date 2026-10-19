"use client";

import SearchBar from "@codegouvfr/react-dsfr/SearchBar";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { RECHERCHE_LONGUEUR_MIN } from "shared/models/data/nationalStats.model";

import { TableSkeleton } from "@/app/_components/common/Skeleton";

import { usePageForParams } from "../hooks/usePageForParams";
import { useRechercheEtablissements } from "../hooks/useStatsQueries";
import { StatsTablePagination } from "../tables/StatsTablePagination";
import { StatsErrorHandler } from "../ui/StatsErrorHandler";

import styles from "./RechercheEtablissements.module.css";
import { RechercheResultatCard } from "./RechercheResultatCard";

export function RechercheEtablissements() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const terme = searchParams?.get("q")?.trim() ?? "";
  const [saisie, setSaisie] = useState(terme);
  const termeEcritRef = useRef(terme);
  const [limit, setLimit] = useState(10);
  const [page, setPage] = usePageForParams({ terme, limit });

  const lancer = useCallback(
    (valeur: string) => {
      const recherche = valeur.trim();
      const cible = recherche.length >= RECHERCHE_LONGUEUR_MIN ? recherche : "";
      if (cible === terme) return;
      termeEcritRef.current = cible;
      const params = new URLSearchParams(searchParams?.toString());
      if (cible) params.set("q", cible);
      else params.delete("q");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [terme, searchParams, router, pathname]
  );

  // Recherche à la frappe à partir du 3e caractère, comme la liste des effectifs CFA
  useEffect(() => {
    const timer = setTimeout(() => lancer(saisie), 300);
    return () => clearTimeout(timer);
  }, [saisie, lancer]);

  // Navigation extérieure (retour arrière, lien) : la saisie suit l'URL, sauf quand c'est nous qui l'avons écrite
  useEffect(() => {
    if (terme !== termeEcritRef.current) {
      termeEcritRef.current = terme;
      setSaisie(terme);
    }
  }, [terme]);

  const { data, isLoading, isPlaceholderData, error } = useRechercheEtablissements(terme, page, limit);
  // Pendant une nouvelle requête, les résultats précédents restent affichés (atténués) avec leur propre terme
  const [termeDesResultats, setTermeDesResultats] = useState(terme);
  useEffect(() => {
    if (data && !isPlaceholderData) setTermeDesResultats(terme);
  }, [data, isPlaceholderData, terme]);
  const termeAffiche = isPlaceholderData ? termeDesResultats : terme;
  const longueurSaisie = saisie.trim().length;
  const tropCourt = longueurSaisie > 0 && longueurSaisie < RECHERCHE_LONGUEUR_MIN;

  return (
    <>
      <section className={styles.recherche}>
        <h2 className={styles.accroche}>
          Accédez à toutes les informations de suivi sur la Mission Locale ou le CFA de votre choix
        </h2>
        <SearchBar
          className={styles.searchBar}
          label="Rechercher un nom d'établissement ou une commune"
          onButtonClick={lancer}
          renderInput={({ className, id, type }) => (
            <input
              className={className}
              id={id}
              type={type}
              value={saisie}
              placeholder="Rechercher nom d'établissement, commune…"
              maxLength={100}
              onChange={(event) => setSaisie(event.target.value)}
            />
          )}
        />
        {tropCourt && (
          <p className={styles.perimetre}>
            Saisissez au moins {RECHERCHE_LONGUEUR_MIN} caractères pour lancer la recherche.
          </p>
        )}
      </section>

      {terme.length >= RECHERCHE_LONGUEUR_MIN && (
        <section
          className={`${styles.resultats} ${isPlaceholderData ? styles.enCours : ""}`}
          aria-live="polite"
          aria-busy={isPlaceholderData}
        >
          <div>
            <h2 className={styles.resultatsTitre}>Résultat(s) pour votre recherche</h2>
            <p className={styles.terme}>
              <strong>“{termeAffiche}”</strong>
              {data && (
                <span className={styles.total}>
                  {data.total.toLocaleString("fr-FR")} résultat{data.total > 1 ? "s" : ""}
                </span>
              )}
            </p>
          </div>
          <StatsErrorHandler data={data} error={error} isLoading={isLoading}>
            {isLoading ? (
              <TableSkeleton rows={4} />
            ) : !data?.data.length ? (
              <p className={styles.vide}>Aucune Mission Locale ni aucun CFA ne correspond à cette recherche.</p>
            ) : (
              <>
                <ul className={`fr-raw-list ${styles.liste}`}>
                  {data.data.map((resultat) => (
                    <RechercheResultatCard key={`${resultat.type}-${resultat.id}`} resultat={resultat} />
                  ))}
                </ul>
                <StatsTablePagination
                  page={page}
                  totalPages={data.pagination.total_pages}
                  onPageChange={setPage}
                  limit={limit}
                  onLimitChange={setLimit}
                  label="résultats de recherche"
                />
              </>
            )}
          </StatsErrorHandler>
        </section>
      )}
    </>
  );
}
