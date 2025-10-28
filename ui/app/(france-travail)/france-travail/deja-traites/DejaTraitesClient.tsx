"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { SearchBar } from "@codegouvfr/react-dsfr/SearchBar";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";

import { FTHeader } from "@/app/_components/france-travail/FTHeader";
import { useMoisTraites, useArborescence } from "@/app/_components/france-travail/hooks/useFranceTravailQueries";
import { publicConfig } from "@/config.public";

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
  const [downloadError, setDownloadError] = useState<string | null>(null);

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

  const handleDownload = async () => {
    setDownloadError(null);
    try {
      const response = await fetch(
        `${publicConfig.baseUrl}/api/v1/organisation/france-travail/export/effectifs-traites`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors du téléchargement");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const contentDisposition = response.headers.get("content-disposition");
      let filename = `dossiers-traites-${new Date().toISOString().split("T")[0]}.xlsx`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
      setDownloadError("Une erreur est survenue lors du téléchargement du fichier. Veuillez réessayer.");
    }
  };

  const handleEffectifClick = (effectifId: string, mois: string) => {
    const queryParams = new URLSearchParams();
    if (debouncedSearch) queryParams.set("search", debouncedSearch);
    queryParams.set("mois", mois);

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
        {downloadError && (
          <Alert
            severity="error"
            title="Erreur de téléchargement"
            description={downloadError}
            onClose={() => setDownloadError(null)}
            closable
          />
        )}
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
