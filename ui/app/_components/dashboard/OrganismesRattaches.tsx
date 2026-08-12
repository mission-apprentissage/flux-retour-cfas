"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { useMemo } from "react";

import { Pie } from "@/app/_components/dashboard/Pie";
import { convertOrganismeToExport, organismesExportColumns } from "@/common/exports";
import { _get } from "@/common/httpClient";
import { Organisme } from "@/common/internal/Organisme";
import { formatDate } from "@/common/utils/dateUtils";
import { exportDataAsXlsx } from "@/common/utils/exportUtils";

import styles from "./dashboard.module.scss";

interface OrganismesRattachesProps {
  organisme: Organisme;
  modePublique: boolean;
  indicateursOrganismes?: { organismesTransmetteurs: number; organismesNonTransmetteurs: number };
}

export function OrganismesRattaches({ organisme, modePublique, indicateursOrganismes }: OrganismesRattachesProps) {
  const pieData = useMemo(
    () =>
      indicateursOrganismes
        ? [
            { id: "Transmet", value: indicateursOrganismes.organismesTransmetteurs, color: "#00ac8c" },
            { id: "Ne transmet pas", value: indicateursOrganismes.organismesNonTransmetteurs, color: "#ef5800" },
          ]
        : [],
    [indicateursOrganismes]
  );

  return (
    <>
      <section className={styles.organismesCard}>
        <h3 className={styles.subSectionTitle}>
          Nombre d’organismes de formation rattachés à {modePublique ? "cet" : "votre"} établissement
        </h3>
        <p className="fr-text--sm">Répartition des OFA par statut de transmission des effectifs au tableau de bord</p>
        <hr className={styles.separator} />

        <div className={styles.organismesCardBody}>
          <ul className={styles.legendList}>
            <li className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.legendDotTransmet}`} aria-hidden="true" />
              Transmettent les effectifs au tableau de bord
            </li>
            <li className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.legendDotNonTransmet}`} aria-hidden="true" />
              Ne transmettent pas les effectifs au tableau de bord
            </li>
            <li>
              <Button
                priority="secondary"
                iconId="fr-icon-download-line"
                iconPosition="right"
                onClick={async () => {
                  const organismes = await _get<Organisme[]>(`/api/v1/organismes/${organisme._id}/organismes`);
                  exportDataAsXlsx(
                    `tdb-organismes-non-transmetteurs-${formatDate(new Date(), "dd-MM-yy")}.xlsx`,
                    organismes
                      .filter((item) => !item.last_transmission_date)
                      .map((item) => convertOrganismeToExport(item)),
                    organismesExportColumns
                  );
                }}
              >
                Télécharger la liste des organismes qui ne transmettent pas
              </Button>
            </li>
          </ul>

          <div className={styles.pieWrapper}>
            <Pie data={pieData} />
          </div>
        </div>
      </section>

      <div className={styles.alignRight}>
        <Button
          priority="secondary"
          linkProps={{ href: `${modePublique ? `/organismes/${organisme._id}` : ""}/organismes` }}
        >
          Voir la liste complète
        </Button>
      </div>
    </>
  );
}
