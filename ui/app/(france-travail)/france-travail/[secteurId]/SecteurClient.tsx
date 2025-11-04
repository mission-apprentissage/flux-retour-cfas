"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

import { FTEffectifsTable } from "@/app/_components/france-travail/FTEffectifsTable";
import { FTHeader } from "@/app/_components/france-travail/FTHeader";
import { useArborescence, useEffectifsBySecteur } from "@/app/_components/france-travail/hooks/useFranceTravailQueries";
import { usePlausibleAppTracking } from "@/app/_hooks/plausible";

export default function SecteurClient() {
  const { trackPlausibleEvent } = usePlausibleAppTracking();
  const router = useRouter();
  const params = useParams();
  const codeSecteur = params?.secteurId ? Number(params.secteurId) : null;

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const hasTrackedSearchRef = useRef(false);

  const { data: arborescenceData, isLoading: arboLoading } = useArborescence();
  const secteurs = arborescenceData?.a_traiter.secteurs ?? [];
  const secteurExists = secteurs.find((s) => s.code_secteur === codeSecteur);
  const secteurLabel = secteurExists?.libelle_secteur;

  const {
    data: effectifsData,
    isLoading,
    error,
  } = useEffectifsBySecteur(codeSecteur, {
    page: currentPage,
    limit: pageSize,
    search: debouncedSearch,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setCurrentPage(1);

      if (searchInput && !hasTrackedSearchRef.current) {
        trackPlausibleEvent("isc_liste_recherche_utilisee", undefined, {
          search: searchInput,
        });
        hasTrackedSearchRef.current = true;
      } else if (!searchInput) {
        hasTrackedSearchRef.current = false;
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setSearchInput("");
    setDebouncedSearch("");
    setCurrentPage(1);
  }, [codeSecteur]);

  if (arborescenceData && !arboLoading && !secteurExists) {
    return (
      <div style={{ ...fr.spacing("padding", { topBottom: "4v" }) }}>
        <Alert severity="error" title="Secteur introuvable" description="Le secteur d'activité demandé n'existe pas." />
      </div>
    );
  }

  const handleSearchChange = (search: string) => {
    setSearchInput(search);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleEffectifClick = (effectifId: string) => {
    const queryParams = new URLSearchParams();
    if (debouncedSearch) queryParams.set("search", debouncedSearch);
    if (currentPage > 1) queryParams.set("page", currentPage.toString());
    if (pageSize !== 20) queryParams.set("limit", pageSize.toString());

    const queryString = queryParams.toString();
    router.push(`/france-travail/${codeSecteur}/effectif/${effectifId}${queryString ? `?${queryString}` : ""}`);
  };

  if (error) {
    return (
      <div style={{ ...fr.spacing("padding", { topBottom: "4v" }) }}>
        <Alert
          severity="error"
          title="Erreur de chargement"
          description="Impossible de charger les effectifs du secteur. Veuillez réessayer ultérieurement."
        />
      </div>
    );
  }

  return (
    <>
      <FTHeader secteurLabel={secteurLabel} />
      <FTEffectifsTable
        effectifs={effectifsData?.effectifs || []}
        secteurLabel={secteurLabel || ""}
        codeSecteur={codeSecteur!}
        isLoading={isLoading}
        totalCount={effectifsData?.pagination?.total || 0}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onSearchChange={handleSearchChange}
        searchTerm={searchInput}
        onEffectifClick={handleEffectifClick}
      />
    </>
  );
}
