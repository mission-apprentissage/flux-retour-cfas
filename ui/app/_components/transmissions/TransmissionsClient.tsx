"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { PageHeader } from "@/app/_components/page-header/PageHeader";
import { TableSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { DataTable } from "@/app/_components/table/DataTable";
import { formatDate } from "@/app/_utils/date.utils";
import { PAGES } from "@/app/_utils/routes.utils";
import { _get, _put } from "@/common/httpClient";
import { useOrganisationOrganisme, useOrganisme } from "@/hooks/organismes";

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
  { label: "", dataKey: "actions", sortable: false },
];

interface TransmissionsClientProps {
  modePublique?: boolean;
  organismeId?: string;
}

export default function TransmissionsClient({ modePublique = false, organismeId }: TransmissionsClientProps) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const { organisme: organisationOrganisme, error: organisationError } = useOrganisationOrganisme(!modePublique);
  const { organisme: organismePublique, error: organismeError } = useOrganisme(modePublique ? organismeId : null);

  const organisme = modePublique ? organismePublique : organisationOrganisme;
  const organismeLoadError = modePublique ? organismeError : organisationError;

  // efface la notification « erreurs de transmission » du header dès que la page est consultée par l'organisme lui-même
  useEffect(() => {
    if (!modePublique && organisme?.has_transmission_errors) {
      _put(`/api/v1/organismes/${organisme._id}/transmission/reset-notification`, {});
    }
  }, [organisme, modePublique]);

  const {
    data,
    error,
    isLoading: isLoadingTransmissions,
  } = useQuery<TransmissionsByDayResponse, any>({
    queryKey: ["transmissions", organisme?._id, page, limit],
    queryFn: ({ signal }) =>
      _get(`/api/v1/organismes/${organisme?._id}/transmission`, { params: { page, limit }, signal }),
    enabled: !!organisme,
  });

  const detailHref = (day: string) =>
    modePublique && organisme
      ? PAGES.dynamic.organismeTransmissionsJour({ organismeId: organisme._id, date: day }).getPath()
      : PAGES.dynamic.transmissionsJour({ date: day }).getPath();

  const toTableRow = (transmission: TransmissionDay) => {
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
            linkProps={{ href: detailHref(transmission.day) }}
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
  };

  if (organismeLoadError) {
    return (
      <Alert
        severity="error"
        title="Accès refusé"
        description="Vous ne disposez pas des droits nécessaires pour visualiser cette page."
      />
    );
  }

  return (
    <div>
      <PageHeader
        title={`${modePublique ? "Ses" : "Mes"} transmissions`}
        titleAs={modePublique ? "h2" : "h1"}
        intro="Visualisez l’état de la donnée des apprenants et leurs contrats transmis ou non, via l’API. L’ensemble des éléments manquants et/ou invalides sont listés dans un rapport complet."
      />

      {error ? (
        <Alert
          severity="error"
          title="Impossible de charger les transmissions"
          description="Une erreur est survenue lors du chargement des rapports de transmission. Veuillez réessayer ultérieurement."
        />
      ) : !organisme || isLoadingTransmissions ? (
        <TableSkeleton />
      ) : (
        <DataTable
          data={(data?.data ?? []).map(toTableRow)}
          columns={TRANSMISSIONS_COLUMNS}
          tableLabel="Transmissions par jour"
          pagination={data?.pagination ?? null}
          onPageChange={setPage}
          onPageSizeChange={setLimit}
          pageSize={limit}
          emptyMessage="Aucune transmission à afficher"
        />
      )}
    </div>
  );
}
