"use client";

import Alert from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { SearchBar } from "@codegouvfr/react-dsfr/SearchBar";
import { Tag } from "@codegouvfr/react-dsfr/Tag";
import { useMemo, useState } from "react";

import { FullTable } from "@/app/_components/table/FullTable";
import { ColumnData } from "@/app/_components/table/types";
import { usePlausibleAppTracking } from "@/app/_hooks/plausible";
import { publicConfig } from "@/config.public";

import styles from "./FTEffectifsTable.module.css";
import { IEffectifFranceTravail } from "./types";
import { getDureeBadgeProps } from "./utils";

interface FTEffectifsTableProps {
  effectifs: IEffectifFranceTravail[];
  secteurLabel: string;
  codeSecteur: number;
  isLoading?: boolean;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSearchChange: (search: string) => void;
  searchTerm: string;
  onEffectifClick: (effectifId: string) => void;
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
  codeSecteur,
  isLoading = false,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
  searchTerm,
  onEffectifClick,
}: FTEffectifsTableProps) {
  const { trackPlausibleEvent } = usePlausibleAppTracking();
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const totalPages = Math.ceil(totalCount / pageSize);

  const handlePageChange = (page: number) => {
    onPageChange(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    onPageSizeChange(newPageSize);
  };

  const handleDownload = async () => {
    setDownloadError(null);
    try {
      const response = await fetch(
        `${publicConfig.baseUrl}/api/v1/organisation/france-travail/export/effectifs/${codeSecteur}`,
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
      let filename = `inscrit-sans-contrats-TBA-${new Date().toISOString().split("T")[0]}.xlsx`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      a.download = filename;

      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      trackPlausibleEvent("isc_liste_telechargement");
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
      setDownloadError("Une erreur est survenue lors du téléchargement du fichier. Veuillez réessayer.");
    }
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
      const niveau = effectif.effectif_snapshot.formation.niveau_libelle || "Non renseigné";
      const joursSansContrat = effectif.jours_sans_contrat;
      const aTraiter = effectif.ft_data ? Object.values(effectif.ft_data).some((v) => v === null) : true;

      return {
        _id: effectif._id,
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
                onClick={(e) => {
                  e.stopPropagation();
                  onEffectifClick(effectif._id);
                }}
                aria-label={`Voir le détail de ${nom} ${prenom}`}
              >
                <i className="fr-icon-arrow-right-line fr-icon--sm" aria-hidden="true" />
              </button>
            </div>
          ),
        },
      };
    });
  }, [effectifs, onEffectifClick]);

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

      {downloadError && (
        <Alert
          severity="error"
          title="Erreur"
          description={downloadError}
          closable
          onClose={() => setDownloadError(null)}
          small
        />
      )}

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
          hasPagination={true}
          onRowClick={(rowData) => {
            trackPlausibleEvent("isc_liste_dossier_ouvert");
            onEffectifClick(rowData._id);
          }}
        />
      )}
    </div>
  );
}
