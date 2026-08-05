"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { TableSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { FullTable } from "@/app/_components/table/FullTable";
import { formatDate } from "@/app/_utils/date.utils";
import { PAGES } from "@/app/_utils/routes.utils";
import { _get } from "@/common/httpClient";

import styles from "./transmissions.module.scss";

interface TransmissionDay {
  day: string;
  success: number;
  error: number;
  total: number;
}

interface TransmissionsByDayResponse {
  data: TransmissionDay[];
  pagination: { total: number; page: number; limit: number; lastPage: number };
}

const TRANSMISSIONS_COLUMNS = [
  { label: "Date de transmission", dataKey: "day", sortable: false },
  { label: "Transmission", dataKey: "status", sortable: false },
  { label: "Effectifs transmis", dataKey: "success", sortable: false },
  { label: "Effectifs en échec", dataKey: "error", sortable: false },
  { label: "Total effectifs", dataKey: "total", sortable: false },
  { label: "Voir", dataKey: "actions", sortable: false },
];

function toTableRow(transmission: TransmissionDay) {
  const formattedDay = formatDate(transmission.day);
  const hasError = Number(transmission.error) > 0;

  return {
    _id: transmission.day,
    rawData: transmission,
    element: {
      day: formattedDay,
      status: hasError ? (
        <span className={`${styles.status} ${styles.statusIncomplete}`}>
          <i className={fr.cx("fr-icon-close-circle-fill", "fr-icon--sm")} aria-hidden="true" />
          Incomplète
        </span>
      ) : (
        <span className={`${styles.status} ${styles.statusComplete}`}>
          <i className={fr.cx("fr-icon-checkbox-circle-fill", "fr-icon--sm")} aria-hidden="true" />
          Complète
        </span>
      ),
      success: transmission.success,
      error: <span className={hasError ? styles.errorCount : undefined}>{transmission.error}</span>,
      total: transmission.total,
      actions: (
        <Button
          linkProps={{ href: PAGES.dynamic.adminTransmissionsJour({ date: transmission.day }).getPath() }}
          priority="tertiary no outline"
          size="small"
          iconId="fr-icon-arrow-right-line"
          iconPosition="right"
          title={`Voir le rapport du ${formattedDay}`}
        >
          Voir le rapport
        </Button>
      ),
    },
  };
}

export default function TransmissionsAdminClient() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const { data, error, isLoading } = useQuery<TransmissionsByDayResponse, any>(
    ["admin", "transmissions", page, limit],
    ({ signal }) => _get("/api/v1/admin/transmissions", { params: { page, limit }, signal })
  );

  return (
    <>
      <h1 className={styles.title}>Toutes les transmissions</h1>
      <p className={styles.intro}>Visualisez l’état des données transmises ou non, jour par jour, par organisme.</p>

      {error ? (
        <Alert
          severity="error"
          title="Impossible de charger les transmissions"
          description="Une erreur est survenue lors du chargement des rapports de transmission. Veuillez réessayer ultérieurement."
        />
      ) : isLoading ? (
        <TableSkeleton />
      ) : (
        <div className={styles.tableWrapper}>
          <FullTable
            data={(data?.data ?? []).map(toTableRow)}
            columns={TRANSMISSIONS_COLUMNS}
            pagination={data?.pagination ?? null}
            onPageChange={setPage}
            onPageSizeChange={setLimit}
            pageSize={limit}
            emptyMessage="Aucune transmission à afficher"
          />
        </div>
      )}
    </>
  );
}
