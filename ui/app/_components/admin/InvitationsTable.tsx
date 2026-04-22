"use client";

import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { SearchBar } from "@codegouvfr/react-dsfr/SearchBar";
import { Box, Stack, Typography } from "@mui/material";
import { SortingState } from "@tanstack/react-table";
import NavLink from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { FullTable } from "@/app/_components/table/FullTable";
import { ColumnData } from "@/app/_components/table/types";
import { AdminInvitation, useAdminInvitations } from "@/app/_hooks/useAdminInvitations";
import { _delete, _post } from "@/common/httpClient";
import useToaster from "@/hooks/useToaster";

interface InvitationsTableProps {
  status: "pending" | "consumed";
  organisation_id?: string;
}

const COLUMNS_PENDING: ColumnData[] = [
  { label: "Destinataire", dataKey: "recipient", width: "22%" },
  { label: "Organisation", dataKey: "organisation", width: "26%" },
  { label: "Rôle", dataKey: "role", width: "9%" },
  { label: "Auteur", dataKey: "author", width: "15%" },
  { label: "Envoyée le", dataKey: "created_at", width: "10%", sortable: true },
  { label: "Expire", dataKey: "expires_at", width: "12%" },
  { label: "", dataKey: "actions", width: "6%" },
];

const COLUMNS_CONSUMED: ColumnData[] = [
  { label: "Destinataire", dataKey: "recipient", width: "24%" },
  { label: "Organisation", dataKey: "organisation", width: "30%" },
  { label: "Rôle", dataKey: "role", width: "10%" },
  { label: "Auteur", dataKey: "author", width: "18%" },
  { label: "Envoyée le", dataKey: "created_at", width: "9%", sortable: true },
  { label: "Délai d'activation", dataKey: "delay", width: "9%" },
];

const ORGA_TYPE_LABELS: Record<string, string> = {
  ORGANISME_FORMATION: "CFA",
  MISSION_LOCALE: "ML",
  FRANCE_TRAVAIL: "France Travail",
  ARML: "ARML",
};

function formatDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR");
}

function describeExpiration(expiresAt?: string): { label: string; severity: "success" | "warning" | "error" | "info" } {
  if (!expiresAt) return { label: "Jamais", severity: "info" };
  const now = Date.now();
  const exp = new Date(expiresAt).getTime();
  if (exp < now) return { label: "Expirée", severity: "error" };
  const diffH = Math.floor((exp - now) / (60 * 60 * 1000));
  if (diffH < 24) return { label: `Dans ${diffH}h`, severity: "error" };
  const diffD = Math.floor(diffH / 24);
  return { label: `Dans ${diffD}j`, severity: diffD < 2 ? "warning" : "success" };
}

function describeDelay(_createdAt?: string): string {
  return "—";
}

const cancelModal = createModal({
  id: "cancel-invitation-admin",
  isOpenedByDefault: false,
});

const resendModal = createModal({
  id: "resend-invitation-admin",
  isOpenedByDefault: false,
});

export default function InvitationsTable({ status, organisation_id }: InvitationsTableProps) {
  const { toastSuccess, toastError } = useToaster();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sorting, setSorting] = useState<SortingState>([{ id: "created_at", desc: true }]);
  const [pendingAction, setPendingAction] = useState<{ id: string; email: string } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { invitations, pagination, isLoading, refetch } = useAdminInvitations({
    status,
    organisation_id,
    search: debouncedSearch,
    page: currentPage,
    limit: pageSize,
    sorting,
  });

  const confirmCancel = useCallback(async () => {
    if (!pendingAction) return;
    try {
      await _delete(`/api/v1/admin/invitations/${pendingAction.id}`);
      toastSuccess(`Invitation à ${pendingAction.email} annulée`);
      cancelModal.close();
      setPendingAction(null);
      await refetch();
    } catch (err: any) {
      toastError(err?.json?.data?.message || "Erreur lors de l'annulation");
    }
  }, [pendingAction, toastSuccess, toastError, refetch]);

  const confirmResend = useCallback(async () => {
    if (!pendingAction) return;
    try {
      const res = await _post<any, { email: string; expiresAt: string }>(
        `/api/v1/admin/invitations/${pendingAction.id}/resend`,
        {}
      );
      toastSuccess(
        `Email renvoyé à ${res.email}. Nouvelle expiration : ${new Date(res.expiresAt).toLocaleString("fr-FR")}`
      );
      resendModal.close();
      setPendingAction(null);
      await refetch();
    } catch (err: any) {
      toastError(err?.json?.data?.message || "Erreur lors du renvoi");
    }
  }, [pendingAction, toastSuccess, toastError, refetch]);

  const tableData = useMemo(() => {
    return invitations.map((inv: AdminInvitation) => {
      const orgaType = inv.organisation?.type ? ORGA_TYPE_LABELS[inv.organisation.type] || inv.organisation.type : "—";
      const orgaName =
        inv.organisation?.organisme?.nom ||
        inv.organisation?.organisme?.enseigne ||
        inv.organisation?.organisme?.raison_sociale ||
        inv.organisation?.nom ||
        "Organisation inconnue";
      const orgaSiret = inv.organisation?.siret || inv.organisation?.organisme?.siret;
      const expiration = describeExpiration(inv.expires_at);

      return {
        rawData: {
          ...inv,
        },
        element: {
          recipient: (
            <Stack spacing={0.25}>
              <Typography variant="body2" fontWeight={500}>
                {[inv.prenom, inv.nom].filter(Boolean).join(" ") || "—"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {inv.email}
              </Typography>
            </Stack>
          ),
          organisation: inv.organisation ? (
            <Stack spacing={0.25}>
              {inv.organisation._id ? (
                <Typography
                  component={NavLink}
                  href={`/organismes/${inv.organisation._id}`}
                  variant="body2"
                  sx={{
                    color: "primary.main",
                    textDecoration: "none",
                    fontWeight: 500,
                    "&:hover": { textDecoration: "underline" },
                  }}
                >
                  {orgaName}
                </Typography>
              ) : (
                <Typography variant="body2" fontWeight={500}>
                  {orgaName}
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary">
                {orgaType}
                {orgaSiret ? ` • SIRET ${orgaSiret}` : ""}
              </Typography>
            </Stack>
          ) : (
            <Typography variant="caption" color="text.secondary">
              —
            </Typography>
          ),
          role: inv.role ? (
            <Badge severity={inv.role === "admin" ? "info" : "new"} small>
              {inv.role === "admin" ? "Admin" : "Membre"}
            </Badge>
          ) : (
            "—"
          ),
          author: inv.author ? (
            <Stack spacing={0.25}>
              <Typography variant="caption">
                {[inv.author.prenom, inv.author.nom].filter(Boolean).join(" ") || "—"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {inv.author.email}
              </Typography>
            </Stack>
          ) : (
            "—"
          ),
          created_at: formatDate(inv.created_at),
          expires_at: (
            <Badge severity={expiration.severity} small>
              {expiration.label}
            </Badge>
          ),
          delay: describeDelay(inv.created_at),
          actions:
            status === "pending" ? (
              <Stack direction="row" spacing={0.5} justifyContent="center">
                <Button
                  priority="tertiary no outline"
                  size="small"
                  iconId="ri-mail-send-line"
                  title="Renvoyer"
                  onClick={() => {
                    setPendingAction({ id: inv._id, email: inv.email });
                    resendModal.open();
                  }}
                >
                  {""}
                </Button>
                <Button
                  priority="tertiary no outline"
                  size="small"
                  iconId="ri-close-circle-line"
                  title="Annuler"
                  onClick={() => {
                    setPendingAction({ id: inv._id, email: inv.email });
                    cancelModal.open();
                  }}
                >
                  {""}
                </Button>
              </Stack>
            ) : null,
        },
      };
    });
  }, [invitations, status]);

  const columns = status === "pending" ? COLUMNS_PENDING : COLUMNS_CONSUMED;

  return (
    <Stack spacing={2}>
      <SearchBar
        label="Rechercher une invitation"
        onButtonClick={(value) => setSearchTerm(value)}
        renderInput={({ className, id, type }) => (
          <input
            className={className}
            id={id}
            placeholder="Email, nom, organisme, SIRET..."
            type={type}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        )}
      />
      <Box>
        <Typography variant="body2" color="text.secondary">
          {isLoading
            ? "Chargement..."
            : `${pagination.total} invitation${pagination.total > 1 ? "s" : ""} ${status === "pending" ? "en cours" : "consommée" + (pagination.total > 1 ? "s" : "")}`}
        </Typography>
      </Box>
      <FullTable
        data={tableData}
        columns={columns}
        pagination={pagination}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        pageSize={pageSize}
        sorting={sorting}
        onSortingChange={setSorting}
        emptyMessage={status === "pending" ? "Aucune invitation en cours" : "Aucune invitation consommée"}
      />

      <cancelModal.Component
        title="Annuler l'invitation"
        buttons={[
          { children: "Fermer", doClosesModal: true, priority: "secondary" },
          {
            children: "Confirmer l'annulation",
            priority: "primary",
            doClosesModal: false,
            nativeButtonProps: { type: "button" },
            onClick: confirmCancel,
          },
        ]}
      >
        Voulez-vous vraiment annuler l&apos;invitation à <strong>{pendingAction?.email}</strong> ? Le destinataire ne
        pourra plus activer son compte via ce lien.
      </cancelModal.Component>

      <resendModal.Component
        title="Renvoyer l'email d'invitation"
        buttons={[
          { children: "Fermer", doClosesModal: true, priority: "secondary" },
          {
            children: "Renvoyer",
            priority: "primary",
            doClosesModal: false,
            nativeButtonProps: { type: "button" },
            onClick: confirmResend,
          },
        ]}
      >
        Un nouvel email sera envoyé à <strong>{pendingAction?.email}</strong> avec une expiration renouvelée à 96
        heures.
      </resendModal.Component>
    </Stack>
  );
}
