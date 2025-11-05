"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useMemo } from "react";

import { FTEffectifsTable } from "@/app/_components/france-travail/FTEffectifsTable";
import { FTHeader } from "@/app/_components/france-travail/FTHeader";
import {
  useArborescence,
  useDepartementCounts,
  useEffectifsBySecteur,
} from "@/app/_components/france-travail/hooks/useFranceTravailQueries";
import { getDepartementsByRegion } from "@/app/_components/france-travail/utils/departements";
import { LOCAL_STORAGE_KEYS } from "@/app/_constants/localStorage";
import { useAuth } from "@/app/_context/UserContext";
import { usePlausibleAppTracking } from "@/app/_hooks/plausible";

export default function SecteurClient() {
  const { trackPlausibleEvent } = usePlausibleAppTracking();
  const router = useRouter();
  const params = useParams();
  const codeSecteur = params?.secteurId ? Number(params.secteurId) : null;
  const { user } = useAuth();

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedDepartements, setSelectedDepartements] = useState<string[]>([]);
  const hasTrackedSearchRef = useRef(false);

  const { data: arborescenceData, isLoading: arboLoading } = useArborescence();
  const secteurs = arborescenceData?.a_traiter.secteurs ?? [];
  const secteurExists = secteurs.find((s) => s.code_secteur === codeSecteur);
  const secteurLabel = secteurExists?.libelle_secteur;

  const departementsOptions = useMemo(() => {
    const codeRegion = user?.organisation?.code_region;
    if (!codeRegion) return [];
    const depts = getDepartementsByRegion(codeRegion);
    return depts;
  }, [user]);

  useEffect(() => {
    if (departementsOptions.length > 0) {
      const storedDepartements = localStorage.getItem(LOCAL_STORAGE_KEYS.FT_SELECTED_DEPARTEMENTS);
      if (storedDepartements) {
        try {
          const parsed = JSON.parse(storedDepartements);
          const availableDeptCodes = departementsOptions.map((opt) => opt.value);
          const validDepartements = parsed.filter((code: string) => availableDeptCodes.includes(code));
          if (validDepartements.length > 0) {
            setSelectedDepartements(validDepartements);
            return;
          }
        } catch (e) {
          console.error("Error parsing stored departements:", e);
          localStorage.removeItem(LOCAL_STORAGE_KEYS.FT_SELECTED_DEPARTEMENTS);
        }
      }
      const allDeptCodes = departementsOptions.map((opt) => opt.value);
      setSelectedDepartements(allDeptCodes);
    }
  }, [departementsOptions]);

  const {
    data: effectifsData,
    isLoading,
    error,
  } = useEffectifsBySecteur(codeSecteur, {
    page: currentPage,
    limit: pageSize,
    search: debouncedSearch,
    departements: selectedDepartements.length > 0 ? selectedDepartements.join(",") : undefined,
  });

  const { data: departementCounts, isLoading: isLoadingCounts } = useDepartementCounts(codeSecteur);

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

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDepartements]);

  if (arborescenceData && !arboLoading && !secteurExists) {
    return (
      <div style={{ ...fr.spacing("padding", { topBottom: "4v" }) }}>
        <Alert severity="error" title="Secteur introuvable" description="Le secteur d'activité demandé n'existe pas." />
      </div>
    );
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleDepartementsChange = (departements: string[]) => {
    setSelectedDepartements(departements);
    localStorage.setItem(LOCAL_STORAGE_KEYS.FT_SELECTED_DEPARTEMENTS, JSON.stringify(departements));
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
      <FTHeader
        secteurLabel={secteurLabel}
        codeSecteur={codeSecteur}
        departementsOptions={departementsOptions}
        selectedDepartements={selectedDepartements}
        onDepartementsChange={handleDepartementsChange}
        totalCount={effectifsData?.pagination?.total}
        departementCounts={departementCounts}
        isLoadingCounts={isLoadingCounts}
      />
      <FTEffectifsTable
        effectifs={effectifsData?.effectifs || []}
        secteurLabel={secteurLabel || ""}
        codeSecteur={codeSecteur!}
        isLoading={isLoading}
        totalCount={effectifsData?.pagination?.total || 0}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={handlePageSizeChange}
        onSearchChange={setSearchInput}
        searchTerm={searchInput}
        onEffectifClick={handleEffectifClick}
        departementsOptions={departementsOptions}
        selectedDepartements={selectedDepartements}
      />
    </>
  );
}
