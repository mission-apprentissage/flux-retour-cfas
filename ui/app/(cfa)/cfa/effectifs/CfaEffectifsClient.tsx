"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CfaEffectifsList } from "@/app/_components/ruptures/cfa/CfaEffectifsList";
import { CfaEffectifsSkeleton } from "@/app/_components/ruptures/cfa/CfaEffectifsSkeleton";
import { useCfaEffectifs } from "@/app/_components/ruptures/cfa/hooks";
import { useAuth } from "@/app/_context/UserContext";
import { usePlausibleAppTracking } from "@/app/_hooks/plausible";

export default function CfaEffectifsClient() {
  const { user } = useAuth();
  const organismeId = user?.organisation?.organisme_id;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { trackPlausibleEvent } = usePlausibleAppTracking();

  useEffect(() => {
    trackPlausibleEvent("cfa_tous_effectifs_ouverte");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const page = Number(searchParams?.get("page")) || 1;
  const limit = Number(searchParams?.get("limit")) || 20;
  const search = searchParams?.get("search") || "";
  const sort = searchParams?.get("sort") || "nom";
  const order = (searchParams?.get("order") as "asc" | "desc") || "asc";
  const en_rupture = searchParams?.get("en_rupture") || undefined;
  const collab_status = searchParams?.get("collab_status") || undefined;
  const formation = searchParams?.get("formation") || undefined;

  const [searchInput, setSearchInput] = useState(search);
  const [debouncedSearch, setDebouncedSearch] = useState(search);

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
      router.push(`/cfa/effectifs?${params.toString()}`, { scroll: false });
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
    if (debouncedSearch !== search) {
      updateParams({ search: debouncedSearch || undefined, page: "1" });
    }
  }, [debouncedSearch, search, updateParams]);

  const { data, isLoading } = useCfaEffectifs(organismeId, {
    page,
    limit,
    search: debouncedSearch || undefined,
    sort,
    order,
    en_rupture,
    collab_status,
    formation,
  });

  if (!data && isLoading) {
    return <CfaEffectifsSkeleton />;
  }

  return (
    <div className="fr-container">
      <CfaEffectifsList
        data={data ?? null}
        isAllowedDeca={data?.isAllowedDeca ?? false}
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        sort={sort}
        order={order as "asc" | "desc"}
        enRuptureFilter={en_rupture}
        collabStatusFilter={collab_status}
        formationFilter={formation}
        onParamsChange={updateParams}
      />
    </div>
  );
}
