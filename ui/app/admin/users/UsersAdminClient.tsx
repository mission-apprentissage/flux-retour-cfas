"use client";

import { Breadcrumb } from "@codegouvfr/react-dsfr/Breadcrumb";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Notice } from "@codegouvfr/react-dsfr/Notice";
import { SearchBar } from "@codegouvfr/react-dsfr/SearchBar";
import { Box, Stack, Typography } from "@mui/material";
import { SortingState } from "@tanstack/react-table";
import { useSearchParams } from "next/navigation";
import { useMemo, useState, useCallback, useEffect } from "react";

import { UsersFiltersPanel } from "@/app/_components/admin/UsersFiltersPanel";
import {
  ActionsCell,
  CreatedAtCell,
  OrganisationCell,
  StatusCell,
  UserNameCell,
} from "@/app/_components/admin/UserTableCells";
import { TableSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { FullTable } from "@/app/_components/table/FullTable";
import { useAllUsers } from "@/app/_hooks/useAllUsers";
import { usersExportColumns } from "@/common/exports";
import { _get } from "@/common/httpClient";
import { exportDataAsXlsx } from "@/common/utils/exportUtils";
import { UsersFiltersQuery, parseUsersFiltersFromQuery } from "@/modules/admin/users/models/users-filters";

const USERS_TABLE_COLUMNS = [
  {
    label: "Nom et prénom",
    dataKey: "normalizedNomPrenom",
    width: "28%",
    sortable: true,
  },
  {
    label: "Établissement",
    dataKey: "normalizedOrganismeNom",
    width: "28%",
    sortable: true,
  },
  {
    label: "Date de création",
    dataKey: "created_at",
    width: "20%",
    sortable: true,
  },
  {
    label: "Statut du compte",
    dataKey: "account_status",
    width: "18%",
    sortable: true,
  },
  {
    label: "",
    dataKey: "actions",
    width: "6%",
    sortable: false,
  },
];

function transformUserToTableData(user: any) {
  const displayName = user.organisation?.organisme?.nom || user.organisation?.label || "Aucune organisation";

  return {
    rawData: {
      ...user,
      normalizedNomPrenom: `${user.prenom} ${user.nom}`,
      normalizedOrganismeNom: displayName,
    },
    element: {
      normalizedNomPrenom: <UserNameCell user={user} />,
      normalizedOrganismeNom: <OrganisationCell user={user} displayName={displayName} />,
      created_at: <CreatedAtCell user={user} />,
      account_status: <StatusCell user={user} />,
      actions: <ActionsCell user={user} />,
    },
  };
}

export default function UsersAdminClient() {
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [sorting, setSorting] = useState<SortingState>([{ id: "created_at", desc: true }]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Utilisateurs | Tableau de bord de l'apprentissage";
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const usersFilters = useMemo(() => {
    if (!searchParams) return {};
    const query = Object.fromEntries(searchParams.entries());
    return parseUsersFiltersFromQuery(query as unknown as UsersFiltersQuery);
  }, [searchParams]);

  const {
    users: allUsers,
    pagination,
    isLoading,
  } = useAllUsers(currentPage, itemsPerPage, sorting, debouncedSearchTerm, usersFilters);

  const showSkeleton = isLoading;

  const handleSortingChange = useCallback((newSorting: SortingState) => {
    setSorting(newSorting);
    setCurrentPage(1);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [usersFilters, searchTerm]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const hasFiltersOrSearch = useMemo(() => {
    const hasActiveFilters = Object.values(usersFilters).some((value) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return value !== undefined && value !== null && value !== "";
    });
    return searchTerm !== "" || hasActiveFilters;
  }, [searchTerm, usersFilters]);

  const displayCount = useMemo(() => {
    if (!pagination) return { total: 0, globalTotal: 0 };
    return {
      total: pagination.total,
      globalTotal: pagination.globalTotal,
    };
  }, [allUsers.length, pagination]);

  const tableData = useMemo(() => {
    return allUsers.map(transformUserToTableData);
  }, [allUsers]);

  const handleExport = useCallback(async () => {
    if (isExporting) return;

    try {
      setIsExporting(true);
      setExportError(null);

      const params: Record<string, any> = {
        sort: sorting.length > 0 ? `${sorting[0].id}:${sorting[0].desc ? "-1" : "1"}` : "created_at:-1",
      };

      if (searchTerm.trim()) params.q = searchTerm.trim();

      Object.entries(usersFilters).forEach(([key, value]) => {
        if (Array.isArray(value) && value.length > 0) {
          params[key] = value.join(",");
        }
      });

      const allUsersData = await _get("/api/v1/admin/users/export", { params });

      if (!allUsersData || allUsersData.length === 0) {
        setExportError("Aucun utilisateur ne correspond aux critères de recherche.");
        return;
      }

      const exportData = allUsersData.map((user: any) => ({
        account_status: user.account_status,
        civility: user.civility,
        created_at: user.created_at,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        telephone: user.telephone,
        fonction: user.fonction,
        "organisation.type": user.organisation?.type,
        "organisation.siret": user.organisation?.siret,
        "organisation.uai": user.organisation?.uai,
        "organisation.label": user.organisation?.label,
        "organisation.organisme.nature": user.organisation?.organisme?.nature,
        "organisation.organisme.nom": user.organisation?.organisme?.nom,
        "organisation.organisme.raison_sociale": user.organisation?.organisme?.raison_sociale,
        "organisation.organisme.reseaux": user.organisation?.organisme?.reseaux?.join(", "),
        password_updated_at: user.password_updated_at,
        has_accept_cgu_version: user.has_accept_cgu_version,
        last_connection: user.last_connection,
        _id: user._id,
      }));

      exportDataAsXlsx("users.xlsx", exportData, usersExportColumns);
    } catch (error) {
      console.error("Erreur lors de l'export des utilisateurs:", error);
      setExportError(
        "Une erreur est survenue lors de l'export. Veuillez réessayer ou contacter le support si le problème persiste."
      );
    } finally {
      setIsExporting(false);
    }
  }, [sorting, searchTerm, usersFilters, isExporting]);

  return (
    <Stack spacing={3} sx={{ p: 3 }}>
      <Breadcrumb
        currentPageLabel="Gestion des utilisateurs"
        segments={[
          {
            label: "Accueil",
            linkProps: {
              href: "/",
            },
          },
        ]}
      />
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h1">Gestion des utilisateurs</Typography>
        <Stack direction="row" spacing={2}>
          <Button
            onClick={handleExport}
            iconId="ri-download-line"
            iconPosition="left"
            priority="secondary"
            disabled={isExporting}
          >
            {isExporting ? "Export en cours..." : "Télécharger la liste"}
          </Button>
        </Stack>
      </Box>

      {exportError && (
        <Notice
          title="Erreur lors de l'export"
          description={exportError}
          isClosable
          onClose={() => setExportError(null)}
        />
      )}

      <Stack spacing={3}>
        <UsersFiltersPanel />
        <Stack spacing={3}>
          <SearchBar
            label="Rechercher un utilisateur"
            onButtonClick={(value) => setSearchTerm(value)}
            renderInput={({ className, id, type }) => (
              <input
                className={className}
                id={id}
                placeholder="Nom, prénom, email, organisation..."
                type={type}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            )}
          />
          {showSkeleton ? (
            <TableSkeleton />
          ) : (
            <>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {hasFiltersOrSearch ? (
                    <>
                      {displayCount.total} utilisateur{displayCount.total > 1 ? "s" : ""} trouvé
                      {displayCount.total > 1 ? "s" : ""} ({pagination.globalTotal} au total)
                    </>
                  ) : (
                    <>
                      {pagination.globalTotal} utilisateur{pagination.globalTotal > 1 ? "s" : ""} au total
                    </>
                  )}
                </Typography>
              </Box>
              <Box
                sx={{
                  width: "100%",
                  overflow: "hidden",
                }}
              >
                <FullTable
                  data={tableData}
                  columns={USERS_TABLE_COLUMNS}
                  pagination={pagination}
                  onPageChange={handlePageChange}
                  onPageSizeChange={setItemsPerPage}
                  pageSize={itemsPerPage}
                  sorting={sorting}
                  onSortingChange={handleSortingChange}
                />
              </Box>
            </>
          )}
        </Stack>
      </Stack>
    </Stack>
  );
}
