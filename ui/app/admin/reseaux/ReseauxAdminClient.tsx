"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { useQuery } from "@tanstack/react-query";
import { SortingState } from "@tanstack/react-table";
import { useMemo, useState } from "react";

import { DsfrLink } from "@/app/_components/link/DsfrLink";
import { TableSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { PAGES } from "@/app/_utils/routes.utils";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { AdminTable } from "@/app/admin/_components/AdminTable";
import { _get } from "@/common/httpClient";

interface Reseau {
  _id: string;
  nom: string;
  responsable?: boolean;
  organismes_count: number;
}

const PAGE_SIZE = 20;

const RESEAUX_COLUMNS = [
  { label: "Réseau", dataKey: "nom", width: "50%" },
  { label: "Organismes", dataKey: "organismes" },
  { label: "Responsable", dataKey: "responsable" },
];

export default function ReseauxAdminClient() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [sorting, setSorting] = useState<SortingState>([{ id: "nom", desc: false }]);

  const {
    data: reseaux,
    error,
    isLoading,
  } = useQuery<Reseau[], any>(["admin", "reseaux"], ({ signal }) => _get("/api/v1/admin/reseaux", { signal }));

  const sortedReseaux = useMemo(() => {
    const [criterion] = sorting.length > 0 ? sorting : [{ id: "nom", desc: false }];
    const direction = criterion.desc ? -1 : 1;
    return [...(reseaux ?? [])].sort((a, b) => {
      if (criterion.id === "organismes") {
        return direction * (a.organismes_count - b.organismes_count);
      }
      if (criterion.id === "responsable") {
        return direction * (Number(a.responsable ?? false) - Number(b.responsable ?? false));
      }
      return direction * a.nom.localeCompare(b.nom);
    });
  }, [reseaux, sorting]);

  const lastPage = Math.max(1, Math.ceil(sortedReseaux.length / pageSize));
  const currentPage = Math.min(page, lastPage);
  const pageReseaux = sortedReseaux.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const tableData = pageReseaux.map((reseau) => ({
    _id: reseau._id,
    rawData: {
      nom: reseau.nom,
      organismes: reseau.organismes_count,
      responsable: Number(reseau.responsable ?? false),
    },
    element: {
      nom: (
        <DsfrLink href={PAGES.dynamic.adminReseau({ id: reseau._id }).getPath()} arrow="none">
          {reseau.nom}
        </DsfrLink>
      ),
      organismes: reseau.organismes_count,
      responsable: reseau.responsable ? "Oui" : "Non",
    },
  }));

  return (
    <>
      <AdminPageHeader
        title="Gestion des réseaux"
        intro={
          reseaux
            ? `${sortedReseaux.length} réseau${sortedReseaux.length > 1 ? "x" : ""} — sélectionnez-en un pour gérer ses organismes.`
            : undefined
        }
      />

      {error ? (
        <Alert
          severity="error"
          title="Impossible de charger les réseaux"
          description="Une erreur est survenue lors du chargement de la liste des réseaux. Veuillez réessayer ultérieurement."
        />
      ) : isLoading ? (
        <TableSkeleton />
      ) : (
        <AdminTable
          data={tableData}
          columns={RESEAUX_COLUMNS}
          tableLabel="Liste des réseaux"
          pagination={{ total: sortedReseaux.length, page: currentPage, limit: pageSize, lastPage }}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          pageSize={pageSize}
          sorting={sorting}
          onSortingChange={setSorting}
          emptyMessage="Aucun réseau enregistré"
        />
      )}
    </>
  );
}
