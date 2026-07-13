"use client";

import { useEffect, useRef, useState } from "react";

import { CfaDashboard } from "@/app/_components/ruptures/cfa/CfaDashboard";
import { CfaDashboardSkeleton } from "@/app/_components/ruptures/cfa/CfaDashboardSkeleton";
import { useCfaEffectifs, useCfaEffectifsRuptures, useCfaUrlParams } from "@/app/_components/ruptures/cfa/hooks";
import { useAuth } from "@/app/_context/UserContext";
import { usePlausibleAppTracking } from "@/app/_hooks/plausible";

const RUPTURES_PAGE_SIZE = 100;

export default function CfaClient() {
  const { user } = useAuth();
  const organismeId = user?.organisation?.organisme_id;
  const { searchParams, updateParams } = useCfaUrlParams("/cfa");
  const { trackPlausibleEvent } = usePlausibleAppTracking();
  const hasTrackedSearchRef = useRef(false);

  const urlSearch = searchParams?.get("search") || "";
  const page = Number(searchParams?.get("page")) || 1;
  const urlSort = searchParams?.get("sort") || undefined;
  const urlOrder = searchParams?.get("order") || undefined;
  const collabStatus = searchParams?.get("collab_status") || "";
  const formation = searchParams?.get("formation") || undefined;

  const [searchInput, setSearchInput] = useState(urlSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(urlSearch);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      if (searchInput && !hasTrackedSearchRef.current) {
        trackPlausibleEvent("cfa_liste_recherche");
        hasTrackedSearchRef.current = true;
      } else if (!searchInput) {
        hasTrackedSearchRef.current = false;
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, trackPlausibleEvent]);

  useEffect(() => {
    if (debouncedSearch !== urlSearch) {
      // Les modes liste-rupture et recherche partagent les params sort/order mais ont des défauts
      // différents (date_rupture/desc vs nom/asc) et des colonnes triables distinctes. On réinitialise
      // sort/order à chaque bascule de mode pour que chacun reparte sur son propre défaut.
      const modeChanged = !!debouncedSearch !== !!urlSearch;
      updateParams({
        search: debouncedSearch || undefined,
        page: undefined,
        ...(modeChanged ? { sort: undefined, order: undefined } : {}),
      });
    }
  }, [debouncedSearch, urlSearch, updateParams]);

  const isSearching = !!debouncedSearch;

  // Tri de la liste rupture (défaut : date de rupture décroissante).
  const ruptureSort = urlSort || "date_rupture";
  const ruptureOrder = (urlOrder === "asc" ? "asc" : "desc") as "asc" | "desc";

  const { data: ruptureData, isLoading: isRuptureLoading } = useCfaEffectifsRuptures(
    isSearching ? undefined : organismeId,
    {
      page,
      limit: RUPTURES_PAGE_SIZE,
      sort: ruptureSort,
      order: ruptureOrder,
      collab_status: collabStatus || undefined,
      formation,
    }
  );

  useEffect(() => {
    if (ruptureData) {
      trackPlausibleEvent("cfa_liste_ouverte");
    }
  }, [!!ruptureData]); // eslint-disable-line react-hooks/exhaustive-deps

  // Tri de la recherche (défaut : nom croissant).
  const searchSort = urlSort || "nom";
  const searchOrder = (urlOrder === "desc" ? "desc" : "asc") as "asc" | "desc";

  const { data: searchData, isLoading: isSearchLoading } = useCfaEffectifs(isSearching ? organismeId : undefined, {
    page,
    limit: RUPTURES_PAGE_SIZE,
    search: debouncedSearch || undefined,
    sort: searchSort,
    order: searchOrder,
  });

  if (!organismeId || (!isSearching && ruptureData === undefined && isRuptureLoading)) {
    return <CfaDashboardSkeleton />;
  }

  return (
    <div className="fr-container">
      <CfaDashboard
        ruptureData={ruptureData}
        isRuptureLoading={isRuptureLoading}
        isAllowedDeca={ruptureData?.isAllowedDeca ?? false}
        organismeId={organismeId}
        sort={ruptureSort}
        order={ruptureOrder}
        collabStatusFilter={collabStatus}
        formationFilter={formation}
        onParamsChange={updateParams}
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        searchData={searchData}
        isSearchLoading={isSearchLoading || (!!searchInput && searchInput !== debouncedSearch)}
        searchSort={searchSort}
        searchOrder={searchOrder}
        onSearchSort={(sortKey) => {
          if (sortKey === searchSort) {
            updateParams({ order: searchOrder === "asc" ? "desc" : "asc", page: undefined });
          } else {
            updateParams({ sort: sortKey, order: "asc", page: undefined });
          }
        }}
        onSearchPageChange={(p) => {
          updateParams({ page: p > 1 ? String(p) : undefined });
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
    </div>
  );
}
