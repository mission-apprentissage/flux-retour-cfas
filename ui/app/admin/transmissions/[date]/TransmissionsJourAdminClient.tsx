"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { DsfrLink } from "@/app/_components/link/DsfrLink";
import { TableSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { formatDate } from "@/app/_utils/date.utils";
import { PAGES } from "@/app/_utils/routes.utils";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { AdminTable } from "@/app/admin/_components/AdminTable";
import { _get } from "@/common/httpClient";

import styles from "./transmissions-jour.module.scss";

interface TransmissionOrganisme {
  day: string;
  success: number;
  error: number;
  total: number;
  organisme: { id: string; uai: string; siret: string; nom: string };
}

interface TransmissionsByOrganismeResponse {
  data?: TransmissionOrganisme[];
  pagination?: { total: number; page: number; limit: number };
}

const TRANSMISSIONS_JOUR_COLUMNS = [
  { label: "Organisme", dataKey: "organisme", width: "30%", sortable: false },
  { label: "SIRET", dataKey: "siret", sortable: false },
  { label: "UAI", dataKey: "uai", sortable: false },
  { label: "Effectifs transmis", dataKey: "success", sortable: false },
  { label: "Effectifs en échec", dataKey: "error", sortable: false },
  { label: "Total effectifs", dataKey: "total", sortable: false },
];

function toTableRow(transmission: TransmissionOrganisme) {
  const { organisme } = transmission;

  return {
    _id: organisme.id,
    rawData: {
      ...transmission,
      siret: organisme.siret,
      uai: organisme.uai,
    },
    element: {
      organisme: (
        <DsfrLink href={`/organismes/${organisme.id}`} arrow="none">
          {organisme.nom}
        </DsfrLink>
      ),
      siret: organisme.siret,
      uai: organisme.uai,
      success: transmission.success,
      error: (
        <span className={Number(transmission.error) > 0 ? styles.errorCount : undefined}>{transmission.error}</span>
      ),
      total: transmission.total,
    },
  };
}

export default function TransmissionsJourAdminClient({ date }: { date: string }) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const formattedDate = Number.isNaN(new Date(date).getTime()) ? null : formatDate(date);

  const { data, error, isLoading } = useQuery<TransmissionsByOrganismeResponse, any>({
    queryKey: ["admin", "transmissions", date, page, limit],
    queryFn: ({ signal }) => _get(`/api/v1/admin/transmissions/${date}/error`, { params: { page, limit }, signal }),
  });

  const pagination = data?.pagination
    ? { ...data.pagination, lastPage: Math.ceil(data.pagination.total / data.pagination.limit) }
    : null;

  return (
    <>
      <AdminPageHeader
        backLink={{ href: PAGES.static.adminTransmissions.getPath(), label: "Retour au tableau des rapports" }}
        title={formattedDate ? `Rapport du ${formattedDate}` : "Rapport de transmission"}
        intro={
          pagination
            ? `${pagination.total} organisme${pagination.total > 1 ? "s" : ""} ayant transmis des effectifs ce jour-là`
            : undefined
        }
      />

      {error ? (
        <Alert
          severity="error"
          title="Impossible de charger le rapport"
          description="Une erreur est survenue lors du chargement des transmissions de cette journée. Vérifiez la date demandée ou réessayez ultérieurement."
        />
      ) : isLoading ? (
        <TableSkeleton />
      ) : (
        <AdminTable
          data={(data?.data ?? []).map(toTableRow)}
          columns={TRANSMISSIONS_JOUR_COLUMNS}
          tableLabel={formattedDate ? `Transmissions par organisme du ${formattedDate}` : "Transmissions par organisme"}
          pagination={pagination}
          onPageChange={setPage}
          onPageSizeChange={setLimit}
          pageSize={limit}
          emptyMessage="Aucune transmission pour cette journée"
        />
      )}
    </>
  );
}
