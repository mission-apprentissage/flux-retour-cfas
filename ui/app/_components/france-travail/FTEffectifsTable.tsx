"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { SearchBar } from "@codegouvfr/react-dsfr/SearchBar";
import { Tag } from "@codegouvfr/react-dsfr/Tag";
import { useMemo } from "react";

import { FullTable } from "@/app/_components/table/FullTable";
import { ColumnData } from "@/app/_components/table/types";

import styles from "./FTEffectifsTable.module.css";
import { IEffectifFranceTravail } from "./types";

interface FTEffectifsTableProps {
  effectifs: IEffectifFranceTravail[];
  secteurLabel: string;
  isLoading?: boolean;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSearchChange: (search: string) => void;
  searchTerm: string;
}

interface DureeBadgeProps {
  backgroundColor: string;
  color: string;
  label: string;
}

function getDureeBadgeProps(days: number): DureeBadgeProps {
  if (days <= 30) {
    return { backgroundColor: "#FEF6E3", color: "#716043", label: `${days}j/90` };
  } else if (days <= 60) {
    return { backgroundColor: "#F99782", color: "#FEF4F2", label: `${days}j/90` };
  } else if (days <= 90) {
    return { backgroundColor: "#F95C5E", color: "#FFFFFF", label: `${days}j/90` };
  } else {
    return { backgroundColor: "#E6E6E6", color: "#3A3A3A", label: "+ de 3 mois" };
  }
}

interface StatutBadgeProps {
  badgeClass?: string;
  customStyle?: { backgroundColor: string; color: string };
  icon: string;
  label: string;
}

function getStatutBadgeProps(aTraiter: boolean): StatutBadgeProps {
  if (aTraiter) {
    return {
      badgeClass: "fr-badge--yellow-tournesol",
      icon: "fr-icon-flashlight-fill",
      label: "À TRAITER",
    };
  } else {
    return {
      badgeClass: "fr-badge--success",
      icon: "fr-icon-success-fill",
      label: "TRAITÉ",
    };
  }
}

export function FTEffectifsTable({
  effectifs,
  secteurLabel,
  isLoading = false,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
  searchTerm,
}: FTEffectifsTableProps) {
  const totalPages = Math.ceil(totalCount / pageSize);

  const handlePageChange = (page: number) => {
    onPageChange(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    onPageSizeChange(newPageSize);
  };

  const handleDownload = () => {
    alert("Fonctionnalité en cours de développement");
  };

  const columns: ColumnData[] = [
    { label: "Nom complet", dataKey: "nom", sortable: false, width: "20%" },
    { label: "Organisme", dataKey: "organisme", sortable: false, width: "15%" },
    { label: "Formation", dataKey: "formation", sortable: false, width: "20%" },
    {
      label: <div className={styles.centeredHeader}>Durée sans contrat</div>,
      dataKey: "duree",
      sortable: false,
      width: "15%",
    },
    {
      label: <div className={styles.centeredHeader}>Statut</div>,
      dataKey: "statut",
      sortable: false,
      width: "20%",
    },
    {
      label: <div className={styles.centeredHeader}>Voir</div>,
      dataKey: "voir",
      sortable: false,
      width: "10%",
    },
  ];

  const tableData = useMemo(() => {
    return effectifs.map((effectif) => {
      const nom = effectif.effectif_snapshot.apprenant.nom;
      const prenom = effectif.effectif_snapshot.apprenant.prenom;
      const rqth = effectif.effectif_snapshot.apprenant.rqth;
      const organisme =
        effectif.organisme?.enseigne ||
        effectif.organisme?.raison_sociale ||
        effectif.organisme?.nom ||
        "Non renseigné";
      const formation = effectif.effectif_snapshot.formation.libelle_long || "Non renseignée";
      const niveau = effectif.effectif_snapshot.formation.niveau || "Non renseigné";
      const joursSansContrat = effectif.jours_sans_contrat;
      const aTraiter = effectif.ft_data ? Object.values(effectif.ft_data).some((v) => v === null) : true;

      return {
        rawData: {
          nom: `${nom} ${prenom}`,
          organisme,
          formation,
          duree: joursSansContrat,
          statut: aTraiter,
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
          organisme: (
            <span className={styles.organismeText} title={organisme}>
              {organisme}
            </span>
          ),
          formation: (
            <div className={styles.formationContainer}>
              <div className={styles.formationTitle} title={formation}>
                {formation}
              </div>
              <Tag small>{niveau}</Tag>
            </div>
          ),
          duree: (
            <div className={styles.centeredBadge}>
              {(() => {
                const badgeProps = getDureeBadgeProps(joursSansContrat);
                return (
                  <span
                    className={styles.dureeBadge}
                    style={{ backgroundColor: badgeProps.backgroundColor, color: badgeProps.color }}
                    aria-label="Durée sans contrat"
                  >
                    {badgeProps.label}
                  </span>
                );
              })()}
            </div>
          ),
          statut: (
            <div className={styles.centeredBadge}>
              {(() => {
                const badgeProps = getStatutBadgeProps(aTraiter);
                const badgeClassName = badgeProps.badgeClass ? `fr-badge ${badgeProps.badgeClass}` : "fr-badge";
                const ariaLabel = `Effectif ${badgeProps.label.toLowerCase()}`;

                return (
                  <p className={badgeClassName} style={badgeProps.customStyle} aria-label={ariaLabel}>
                    <i className={`${badgeProps.icon} fr-icon--sm`} />
                    <span style={{ marginLeft: "2px", fontSize: "12px", fontWeight: 700 }}>{badgeProps.label}</span>
                  </p>
                );
              })()}
            </div>
          ),
          voir: (
            <div className={styles.centeredBadge}>
              <button
                className={styles.voirButton}
                onClick={() => console.log("Voir détail effectif", effectif._id)}
                aria-label={`Voir le détail de ${nom} ${prenom}`}
              >
                <i className="fr-icon-arrow-right-line fr-icon--sm" aria-hidden="true" />
              </button>
            </div>
          ),
        },
      };
    });
  }, [effectifs]);

  const paginationInfo = {
    total: totalCount,
    page: currentPage,
    limit: pageSize,
    lastPage: totalPages,
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerText}>
          Télécharger la liste des inscrits sans contrat dans le secteur <strong>{secteurLabel}</strong>
        </div>
        <Button
          priority="secondary"
          iconId="ri-download-line"
          iconPosition="right"
          onClick={handleDownload}
          className={styles.downloadButton}
        >
          Télécharger la liste du secteur
        </Button>
      </div>

      <div className={styles.searchContainer}>
        <SearchBar
          label="Rechercher par nom ou prénom"
          renderInput={({ id, className, placeholder }) => (
            <input
              id={id}
              className={className}
              placeholder={placeholder}
              type="search"
              value={searchTerm}
              disabled={isLoading}
              onChange={(e) => {
                onSearchChange(e.target.value);
              }}
            />
          )}
        />
      </div>

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
          hasPagination
        />
      )}
    </div>
  );
}
