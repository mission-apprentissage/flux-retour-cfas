"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CfaDashboard } from "@/app/_components/ruptures/cfa/CfaDashboard";
import { CfaDashboardSkeleton } from "@/app/_components/ruptures/cfa/CfaDashboardSkeleton";
import { useCfaEffectifs, useCfaEffectifsRuptures } from "@/app/_components/ruptures/cfa/hooks";
import { useAuth } from "@/app/_context/UserContext";

export default function CfaClient() {
  const { user } = useAuth();
  const organismeId = user?.organisation?.organisme_id;
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlSearch = searchParams?.get("search") || "";
  const searchPage = Number(searchParams?.get("page")) || 1;
  const searchSort = searchParams?.get("sort") || "nom";
  const searchOrder = (searchParams?.get("order") || "asc") as "asc" | "desc";

  const [searchInput, setSearchInput] = useState(urlSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(urlSearch);

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams?.toString() || "");
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      const qs = params.toString();
      router.push(qs ? `/cfa?${qs}` : "/cfa", { scroll: false });
    },
    [searchParams, router]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (debouncedSearch !== urlSearch) {
      updateParams({ search: debouncedSearch || undefined, page: undefined });
    }
  }, [debouncedSearch, urlSearch, updateParams]);

  const { data, isLoading } = useCfaEffectifsRuptures(organismeId);

  const { data: searchData, isLoading: isSearchLoading } = useCfaEffectifs(debouncedSearch ? organismeId : undefined, {
    page: searchPage,
    limit: 20,
    search: debouncedSearch || undefined,
    sort: searchSort,
    order: searchOrder,
  });

  if (!organismeId || !data || isLoading) {
    return <CfaDashboardSkeleton />;
  }

  return (
    <div className="fr-container">
      <CfaDashboard
        data={data.segments}
        isAllowedDeca={data.isAllowedDeca}
        organismeId={organismeId}
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        searchData={searchData}
        isSearchLoading={isSearchLoading || (!!searchInput && searchInput !== debouncedSearch)}
        searchSort={searchSort}
        searchOrder={searchOrder}
        onSearchSort={(sortKey) => {
          if (sortKey === searchSort) {
            updateParams({ order: searchOrder === "asc" ? "desc" : "asc" });
          } else {
            updateParams({ sort: sortKey, order: "asc" });
          }
        }}
        onPageChange={(page) => updateParams({ page: page > 1 ? String(page) : undefined })}
      />
    </div>
  );
}
