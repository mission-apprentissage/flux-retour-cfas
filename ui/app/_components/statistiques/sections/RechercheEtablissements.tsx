"use client";

import SearchBar from "@codegouvfr/react-dsfr/SearchBar";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { TableSkeleton } from "@/app/_components/common/Skeleton";
import { useAuth } from "@/app/_context/UserContext";
import { isAdminUser } from "@/app/suivi-des-indicateurs/access";

import { usePageForParams } from "../hooks/usePageForParams";
import { useRechercheEtablissements } from "../hooks/useStatsQueries";
import { useUserRegions } from "../hooks/useUserRegions";
import { StatsTablePagination } from "../tables/StatsTablePagination";
import { StatsErrorHandler } from "../ui/StatsErrorHandler";
import { getRegionLabel } from "../utils";

import styles from "./RechercheEtablissements.module.css";
import { RechercheResultatCard } from "./RechercheResultatCard";

export function RechercheEtablissements() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const terme = searchParams?.get("q")?.trim() ?? "";
  const [saisie, setSaisie] = useState(terme);
  const [limit, setLimit] = useState(10);
  const [page, setPage] = usePageForParams({ terme, limit });
  const { user } = useAuth();
  const { regions } = useUserRegions();
  const perimetre = !isAdminUser(user ?? null) && regions.length ? regions.map(getRegionLabel).join(", ") : null;

  useEffect(() => setSaisie(terme), [terme]);

  const lancer = (valeur: string) => {
    const params = new URLSearchParams(searchParams?.toString());
    if (valeur.trim()) params.set("q", valeur.trim());
    else params.delete("q");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const { data, isLoading, isFetching, isPlaceholderData, error } = useRechercheEtablissements(terme, page, limit);
  const tropCourt = terme.length > 0 && terme.length < 2;

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
              onChange={(event) => setSaisie(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") lancer(saisie);
              }}
            />
          )}
        />
        {perimetre && <p className={styles.perimetre}>Recherche limitée à votre territoire : {perimetre}.</p>}
        {tropCourt && <p className={styles.perimetre}>Saisissez au moins 2 caractères.</p>}
      </section>

      {terme.length >= 2 && (
        <section className={styles.resultats} aria-live="polite">
          <div>
            <h2 className={styles.resultatsTitre}>Résultat(s) pour votre recherche</h2>
            <p className={styles.terme}>
              <strong>“{terme}”</strong>
              {data && (
                <span className={styles.total}>
                  {data.total.toLocaleString("fr-FR")} résultat{data.total > 1 ? "s" : ""}
                </span>
              )}
            </p>
          </div>
          <StatsErrorHandler data={data} error={error} isLoading={isLoading}>
            {isLoading || (isFetching && isPlaceholderData) ? (
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
