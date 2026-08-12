"use client";

import { Tabs } from "@codegouvfr/react-dsfr/Tabs";
import { useQuery } from "@tanstack/react-query";
import { SortingState } from "@tanstack/react-table";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { IndicateursEffectifsAvecOrganisme } from "shared";

import { PageHeader } from "@/app/_components/page-header/PageHeader";
import { useTeteDeReseaux } from "@/app/_hooks/useTeteDeReseaux";
import { convertPaginationInfosToQuery, parsePaginationInfosFromQuery } from "@/common/filters/pagination";
import { _get } from "@/common/httpClient";
import {
  convertEffectifsFiltersToQuery,
  EffectifsFiltersFullQuery,
  parseEffectifsFiltersFullFromQuery,
} from "@/modules/models/effectifs-filters";

import styles from "./indicateurs.module.scss";
import { IndicateursCards } from "./IndicateursCards";
import { IndicateursFiltersPanel } from "./IndicateursFiltersPanel";
import { RepartitionOrganismesTable } from "./RepartitionOrganismesTable";

const DEFAULT_SORT: SortingState = [{ desc: false, id: "nom" }];
const TABS_ID = "indicateurs-organisme-tabs";

export function IndicateursOrganismeClient({ organismeId }: { organismeId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: reseaux } = useTeteDeReseaux();

  const query = useMemo(() => Object.fromEntries(searchParams?.entries() ?? []), [searchParams]);

  const { effectifsFilters, sort } = useMemo(() => {
    const { sort } = parsePaginationInfosFromQuery(query as any);
    return {
      effectifsFilters: parseEffectifsFiltersFullFromQuery(query as unknown as EffectifsFiltersFullQuery),
      sort: sort ?? DEFAULT_SORT,
    };
  }, [query]);

  const { data: indicateursEffectifs, isLoading } = useQuery(
    [organismeId, "indicateurs/effectifs/par-organisme", JSON.stringify(effectifsFilters)],
    () =>
      _get<IndicateursEffectifsAvecOrganisme[]>(
        `/api/v1/organismes/${organismeId}/indicateurs/effectifs/par-organisme`,
        {
          params: convertEffectifsFiltersToQuery(effectifsFilters),
        }
      )
  );

  const indicateursEffectifsTotaux = useMemo(
    () =>
      (indicateursEffectifs ?? []).reduce(
        (acc, indicateursParOrganisme) => {
          acc.apprenants += indicateursParOrganisme.apprenants;
          acc.apprentis += indicateursParOrganisme.apprentis;
          acc.inscrits += indicateursParOrganisme.inscrits;
          acc.abandons += indicateursParOrganisme.abandons;
          acc.rupturants += indicateursParOrganisme.rupturants;
          return acc;
        },
        { apprenants: 0, apprentis: 0, inscrits: 0, abandons: 0, rupturants: 0 }
      ),
    [indicateursEffectifs]
  );

  const updateState = (newParams: Record<string, any>) => {
    const nextQuery = new URLSearchParams({
      ...convertEffectifsFiltersToQuery({ ...effectifsFilters, ...newParams }),
      ...convertPaginationInfosToQuery({ sort, ...newParams }),
    } as Record<string, string>);
    router.replace(`?${nextQuery.toString()}`, { scroll: false });
  };

  const resetFilters = () => router.replace("?", { scroll: false });

  // La vue graphique n'est pas encore développée : l'onglet reste visible mais inactivable.
  useEffect(() => {
    const tabs = document.querySelectorAll<HTMLButtonElement>(`#${TABS_ID} .fr-tabs__tab`);
    const graphiqueTab = tabs[1];
    if (graphiqueTab) {
      graphiqueTab.disabled = true;
      graphiqueTab.setAttribute("aria-disabled", "true");
    }
  }, []);

  return (
    <div>
      <PageHeader title="Ses indicateurs" />

      <Tabs
        id={TABS_ID}
        tabs={[
          { tabId: "globale", label: "Vue globale" },
          { tabId: "graphique", label: "Vue graphique (bientôt disponible)" },
        ]}
        selectedTabId="globale"
        onTabChange={() => undefined}
      >
        <div className={styles.layout}>
          <IndicateursFiltersPanel
            filters={effectifsFilters}
            reseaux={reseaux ?? []}
            onChange={updateState}
            onReset={resetFilters}
          />

          <div>
            <IndicateursCards
              indicateursEffectifs={indicateursEffectifsTotaux}
              loading={isLoading}
              effectifsFilters={effectifsFilters}
              organismeId={organismeId}
            />

            <hr className={styles.separator} />

            <RepartitionOrganismesTable
              indicateurs={indicateursEffectifs ?? []}
              prominentOrganismeId={organismeId}
              loading={isLoading}
              sort={sort}
              onSortChange={(newSort) => updateState({ sort: newSort })}
              date={effectifsFilters.date}
            />
          </div>
        </div>
      </Tabs>
    </div>
  );
}
