"use client";

import { useMemo } from "react";

import { FullTable } from "@/app/_components/table/FullTable";
import { ColumnData } from "@/app/_components/table/types";

import styles from "./FTEffectifsTraitesTable.module.css";
import { IEffectifFranceTravail, ISecteurArborescence } from "./types";
import { formatTraitementDate } from "./utils/dateFormatting";

interface FTEffectifsTraitesTableProps {
  effectifs: IEffectifFranceTravail[];
  secteurs: ISecteurArborescence[];
  isLoading?: boolean;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onEffectifClick: (effectifId: string) => void;
}

export function FTEffectifsTraitesTable({
  effectifs,
  secteurs,
  isLoading = false,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onEffectifClick,
}: FTEffectifsTraitesTableProps) {
  const totalPages = Math.ceil(totalCount / pageSize);

  const handlePageChange = (page: number) => {
    onPageChange(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    onPageSizeChange(newPageSize);
  };

  const columns: ColumnData[] = [
    { label: "Nom complet", dataKey: "nom", sortable: false, width: "25%" },
    { label: "Secteur d'activité", dataKey: "secteur", sortable: false, width: "35%" },
    { label: "Traitement le", dataKey: "dateTraitement", sortable: false, width: "15%" },
    {
      label: <div className={styles.centeredHeader}>Statut</div>,
      dataKey: "statut",
      sortable: false,
      width: "15%",
    },
    {
      label: <div className={styles.centeredHeader}>Voir</div>,
      dataKey: "voir",
      sortable: false,
      width: "10%",
    },
  ];

  const tableData = useMemo(() => {
    const secteurMap = new Map(secteurs.map((s) => [s.code_secteur.toString(), s.libelle_secteur]));

    return effectifs.map((effectif) => {
      const nom = effectif.effectif_snapshot.apprenant.nom;
      const prenom = effectif.effectif_snapshot.apprenant.prenom;
      const rqth = effectif.effectif_snapshot.apprenant.rqth;

      let secteurActivite = "Non renseigné";
      if (effectif.ft_data) {
        const ftDataEntries = Object.entries(effectif.ft_data);
        const firstNonNull = ftDataEntries.find(([_, value]) => value !== null);
        if (firstNonNull) {
          const codeSecteur = firstNonNull[0];
          secteurActivite = secteurMap.get(codeSecteur) || `Secteur ${codeSecteur}`;
        }
      }

      const dateTraitementFormatted = effectif.date_traitement
        ? formatTraitementDate(effectif.date_traitement)
        : "Non renseignée";

      return {
        rawData: {
          nom: `${nom} ${prenom}`,
          secteur: secteurActivite,
          dateTraitement: dateTraitementFormatted,
          statut: false,
        },
        element: {
          nom: (
            <div className={styles.nomContainer}>
              {rqth && (
                <p className="fr-badge fr-badge--red" aria-label="Effectif RQTH">
                  <i className="fr-icon-fire-fill fr-icon--sm" />
                  <span style={{ marginLeft: "5px", fontSize: "12px", fontWeight: 700 }}>RQTH</span>
                </p>
              )}
              <div className={styles.nomText}>
                {nom} {prenom}
              </div>
            </div>
          ),
          secteur: (
            <span className={styles.secteurText} title={secteurActivite}>
              {secteurActivite}
            </span>
          ),
          dateTraitement: <span style={{ color: "var(--text-default-grey)" }}>{dateTraitementFormatted}</span>,
          statut: (
            <div className={styles.centeredBadge}>
              <p className="fr-badge fr-badge--success" style={{ margin: 0 }}>
                <span style={{ fontSize: "12px", fontWeight: 700 }}>TRAITÉ</span>
              </p>
            </div>
          ),
          voir: (
            <div className={styles.centeredBadge}>
              <button
                className={styles.voirButton}
                onClick={() => onEffectifClick(effectif._id)}
                aria-label={`Voir le détail de ${nom} ${prenom}`}
              >
                <i className="fr-icon-arrow-right-line fr-icon--sm" aria-hidden="true" />
              </button>
            </div>
          ),
        },
      };
    });
  }, [effectifs, secteurs, onEffectifClick]);

  const paginationInfo = {
    total: totalCount,
    page: currentPage,
    limit: pageSize,
    lastPage: totalPages,
  };

  return (
    <div className={styles.container}>
      {isLoading ? (
        <div className={styles.skeletonContainer}>
          <div className={styles.skeletonTable}>
            {[...Array(5)].map((_, i) => (
              <div key={i} className={styles.skeletonRow} />
            ))}
          </div>
        </div>
      ) : (
        <FullTable
          data={tableData}
          columns={columns}
          pagination={paginationInfo}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          pageSize={pageSize}
          emptyMessage="Aucun effectif trouvé"
          hasPagination={true}
        />
      )}
    </div>
  );
}
