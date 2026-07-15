"use client";

import { useEffect, useState } from "react";
import { CFA_SUIVI_CATEGORY } from "shared/models/routes/organismes/cfa";
import type { CfaSuiviCategory } from "shared/models/routes/organismes/cfa";

import { CfaCollaborationsList } from "@/app/_components/ruptures/cfa/CfaCollaborationsList";
import { CfaEffectifsSkeleton } from "@/app/_components/ruptures/cfa/CfaEffectifsSkeleton";
import { useCfaSuiviMissionLocale, useCfaUrlParams } from "@/app/_components/ruptures/cfa/hooks";
import { useAuth } from "@/app/_context/UserContext";
import { usePlausibleAppTracking } from "@/app/_hooks/plausible";

const VALID_CATEGORIES = Object.values(CFA_SUIVI_CATEGORY) as string[];

export default function CfaCollaborationsClient() {
  const { user } = useAuth();
  const organismeId = user?.organisation?.organisme_id;
  const { searchParams, updateParams } = useCfaUrlParams("/cfa/collaborations");
  const { trackPlausibleEvent } = usePlausibleAppTracking();

  useEffect(() => {
    trackPlausibleEvent("cfa_collab_en_cours_ouverte");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const categoryParam = searchParams?.get("category") || "";
  const category = (
    VALID_CATEGORIES.includes(categoryParam) ? categoryParam : CFA_SUIVI_CATEGORY.COLLAB
  ) as CfaSuiviCategory;
  const page = Number(searchParams?.get("page")) || 1;
  const search = searchParams?.get("search") || "";
  const sort = searchParams?.get("sort") || "date_rupture";
  const order = searchParams?.get("order") === "asc" ? "asc" : "desc";
  const collabStatusParam = searchParams?.get("collab_status") || "";
  const formation = searchParams?.get("formation") || undefined;

  const [searchInput, setSearchInput] = useState(search);
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (debouncedSearch !== search) {
      updateParams({ search: debouncedSearch || undefined, page: undefined });
    }
  }, [debouncedSearch, search, updateParams]);

  const { data, isLoading } = useCfaSuiviMissionLocale(organismeId, {
    category,
    page,
    limit: 100,
    search: debouncedSearch || undefined,
    sort,
    order,
    collab_status: collabStatusParam || undefined,
    formation,
  });

  if (!data && isLoading) {
    return <CfaEffectifsSkeleton />;
  }

  return (
    <div className="fr-container">
      <CfaCollaborationsList
        data={data ?? null}
        organismeId={organismeId ?? ""}
        category={category}
        onCategoryChange={(c) => updateParams({ category: c, page: undefined, collab_status: undefined })}
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        sort={sort}
        order={order}
        collabStatusFilter={collabStatusParam}
        formationFilter={formation}
        onParamsChange={updateParams}
      />
    </div>
  );
}
