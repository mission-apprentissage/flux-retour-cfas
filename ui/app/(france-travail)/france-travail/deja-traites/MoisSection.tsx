"use client";

import Alert from "@codegouvfr/react-dsfr/Alert";
import { useState } from "react";

import { FTEffectifsTraitesTable } from "@/app/_components/france-travail/FTEffectifsTraitesTable";
import { useEffectifsTraitesParMois } from "@/app/_components/france-travail/hooks/useFranceTravailQueries";
import { ISecteurArborescence } from "@/app/_components/france-travail/types";
import { formatMoisLabelTraite } from "@/app/_components/france-travail/utils/dateFormatting";

import styles from "./DejaTraitesClient.module.css";

interface MoisSectionProps {
  mois: string;
  count: number;
  secteurs: ISecteurArborescence[];
  onEffectifClick: (effectifId: string) => void;
  search: string;
}

export function MoisSection({ mois, count, secteurs, onEffectifClick, search }: MoisSectionProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { data, isLoading, error } = useEffectifsTraitesParMois(mois, {
    page: currentPage,
    limit: pageSize,
    search,
  });

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const moisHeader = (
    <div className={styles.moisHeader}>
      <h3 className={`fr-h3 ${styles.moisTitle}`}>
        {formatMoisLabelTraite(mois)} <span className={styles.moisCount}>({count})</span>
      </h3>
    </div>
  );

  if (error) {
    return (
      <div className={styles.moisSection} id={`mois-${mois}`}>
        {moisHeader}
        <Alert
          severity="error"
          title="Erreur de chargement"
          description="Impossible de charger les effectifs pour ce mois."
          small
        />
      </div>
    );
  }

  return (
    <div className={styles.moisSection} id={`mois-${mois}`}>
      {moisHeader}
      <FTEffectifsTraitesTable
        effectifs={data?.effectifs || []}
        secteurs={secteurs}
        isLoading={isLoading}
        totalCount={data?.pagination.total || 0}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onEffectifClick={onEffectifClick}
      />
    </div>
  );
}
