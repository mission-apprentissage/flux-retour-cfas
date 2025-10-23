"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { SearchBar } from "@codegouvfr/react-dsfr/SearchBar";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";

import { FTHeader } from "@/app/_components/france-travail/FTHeader";
import { useMoisTraites, useArborescence } from "@/app/_components/france-travail/hooks/useFranceTravailQueries";

import styles from "./DejaTraitesClient.module.css";
import { MoisSection } from "./MoisSection";

export default function DejaTraitesClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const moisFromUrl = searchParams?.get("mois");

  const { data: moisData, isLoading: moisLoading, error: moisError } = useMoisTraites();
  const { data: arborescenceData } = useArborescence();

  const secteurs = arborescenceData?.a_traiter.secteurs ?? [];
  const moisList = moisData?.mois ?? [];

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const moisRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (moisFromUrl && moisRefs.current[moisFromUrl]) {
      setTimeout(() => {
        moisRefs.current[moisFromUrl]?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  }, [moisFromUrl, moisList]);

  const handleSearchChange = (search: string) => {
    setSearchInput(search);
  };

  const handleDownload = () => {
    alert("Fonctionnalité en cours de développement");
  };

  const handleEffectifClick = (effectifId: string) => {
    const queryParams = new URLSearchParams();
    if (debouncedSearch) queryParams.set("search", debouncedSearch);

    const queryString = queryParams.toString();
    router.push(`/france-travail/deja-traites/effectif/${effectifId}${queryString ? `?${queryString}` : ""}`);
  };

  if (moisError) {
    return (
      <div style={{ ...fr.spacing("padding", { topBottom: "4v" }) }}>
        <Alert
          severity="error"
          title="Erreur de chargement"
          description="Impossible de charger la liste des mois. Veuillez réessayer ultérieurement."
        />
      </div>
    );
  }

  if (moisLoading) {
    return (
      <div style={{ ...fr.spacing("padding", { topBottom: "4v" }) }}>
        <p>Chargement...</p>
      </div>
    );
  }

  if (moisList.length === 0) {
    return (
      <>
        <FTHeader secteurLabel="Dossiers traités" />
        <div style={{ ...fr.spacing("padding", { topBottom: "4v" }) }}>
          <Alert severity="info" title="Aucun effectif traité" description="Aucun effectif n'a encore été traité." />
        </div>
      </>
    );
  }

  return (
    <>
      <FTHeader secteurLabel="Dossiers traités" />

      <div className={styles.container}>
        <div className={styles.globalControls}>
          <div className={styles.downloadSection}>
            <div className={styles.downloadText}>
              Télécharger la liste des dossiers des jeunes traités par France travail
            </div>
            <Button
              priority="secondary"
              iconId="ri-download-line"
              iconPosition="right"
              onClick={handleDownload}
              className={styles.downloadButton}
            >
              Télécharger la liste
            </Button>
          </div>

          <div className={styles.searchSection}>
            <SearchBar
              label="Rechercher par nom ou prénom"
              renderInput={({ id, className, placeholder }) => (
                <input
                  id={id}
                  className={className}
                  placeholder={placeholder}
                  type="search"
                  value={searchInput}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              )}
            />
          </div>
        </div>

        {moisList.map((moisItem) => (
          <div
            key={moisItem.mois}
            ref={(el) => {
              moisRefs.current[moisItem.mois] = el;
            }}
          >
            <MoisSection
              mois={moisItem.mois}
              count={moisItem.count}
              secteurs={secteurs}
              onEffectifClick={handleEffectifClick}
              search={debouncedSearch}
            />
          </div>
        ))}
      </div>
    </>
  );
}
