"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { SearchBar } from "@codegouvfr/react-dsfr/SearchBar";
import { useQuery } from "@tanstack/react-query";
// eslint-disable-next-line import/no-duplicates
import { format, formatDistanceToNow } from "date-fns";
// eslint-disable-next-line import/no-duplicates
import { fr as frLocale } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";

import { FullTable } from "@/app/_components/table/FullTable";
import { ColumnData } from "@/app/_components/table/types";
import { useCfaAdmin } from "@/app/_hooks/useCfaAdmin";
import { _delete, _get, _post, _put } from "@/common/httpClient";
import useToaster from "@/hooks/useToaster";

import InvitationSidePanel from "./InvitationSidePanel";
import styles from "./RolesHabilitationsClient.module.css";

interface Member {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  account_status: "PENDING_ADMIN_VALIDATION" | "PENDING_EMAIL_VALIDATION" | "CONFIRMED";
  created_at: string;
  confirmed_at?: string;
  last_connection?: string;
  organisation_role?: "admin" | "member";
  fonction?: string;
}

interface Invitation {
  _id: string;
  email: string;
  created_at: string;
  role?: "admin" | "member";
}

function ActivationDateCell({ dateString }: { dateString?: string | null }) {
  if (!dateString) return <span>—</span>;
  try {
    const date = new Date(dateString);
    const formatted = format(date, "dd/MM/yyyy", { locale: frLocale });
    const relative = formatDistanceToNow(date, { locale: frLocale, addSuffix: true });
    return (
      <div className={styles.activationDate}>
        <div>{formatted}</div>
        <div className={styles.activationDateRelative}>{relative}</div>
      </div>
    );
  } catch {
    return <span>—</span>;
  }
}

const deleteMembreModal = createModal({
  id: "delete-membre",
  isOpenedByDefault: false,
});

const cancelInvitationModal = createModal({
  id: "cancel-invitation",
  isOpenedByDefault: false,
});

const roleChangeModal = createModal({
  id: "role-change-member",
  isOpenedByDefault: false,
});

const centered = (text: string) => <div className={styles.centered}>{text}</div>;

function AdminTag() {
  return <span className={styles.adminTag}>ADMIN</span>;
}

const COLUMNS: ColumnData[] = [
  { label: "Nom et prénom", dataKey: "nom", width: "22%" },
  { label: centered("Téléphone"), dataKey: "telephone", width: "12%", sortable: false },
  { label: centered("Courriel"), dataKey: "email", width: "20%" },
  { label: "Intitulé de poste", dataKey: "fonction", width: "10%", sortable: false },
  { label: centered("Date d'activation"), dataKey: "dateActivation", width: "23%" },
  { label: centered("Actions"), dataKey: "actions", width: "14%", sortable: false },
];

export default function RolesHabilitationsClient() {
  const { user, isCfaAdmin } = useCfaAdmin();
  const router = useRouter();
  const { toastSuccess, toastError } = useToaster();
  const [searchTerm, setSearchTerm] = useState("");
  const [isInvitationPanelOpen, setIsInvitationPanelOpen] = useState(false);
  const pendingDeleteRef = useRef<{ userId: string; email: string } | null>(null);
  const pendingCancelRef = useRef<string | null>(null);
  const [pendingRoleChange, setPendingRoleChange] = useState<{
    userId: string;
    email: string;
    newRole: "admin" | "member";
  } | null>(null);
  const [roleChangeError, setRoleChangeError] = useState<string | null>(null);

  const {
    data: membres,
    isLoading: isLoadingMembres,
    refetch: refetchMembres,
  } = useQuery<Member[]>({
    queryKey: ["organisation-membres"],
    queryFn: () => _get("/api/v1/organisation/membres"),
    enabled: isCfaAdmin,
  });

  const {
    data: invitations,
    isLoading: isLoadingInvitations,
    refetch: refetchInvitations,
  } = useQuery<Invitation[]>({
    queryKey: ["organisation-invitations"],
    queryFn: () => _get("/api/v1/organisation/invitations"),
    enabled: isCfaAdmin,
  });

  const openDeleteMembreModal = useCallback((userId: string, email: string) => {
    pendingDeleteRef.current = { userId, email };
    deleteMembreModal.open();
  }, []);

  const confirmDeleteMembre = useCallback(async () => {
    const pending = pendingDeleteRef.current;
    if (!pending) return;
    try {
      await _delete(`/api/v1/organisation/membres/${pending.userId}`);
      await refetchMembres();
      toastSuccess("L'utilisateur a été supprimé");
    } catch (err: any) {
      toastError(err?.json?.data?.message || "Une erreur est survenue");
    }
  }, [refetchMembres, toastSuccess, toastError]);

  const handleResendInvitation = useCallback(
    async (invitationId: string) => {
      try {
        await _post(`/api/v1/organisation/invitations/${invitationId}/resend`);
        toastSuccess("L'email d'invitation a été renvoyé");
      } catch (err: any) {
        toastError(err?.json?.data?.message || "Une erreur est survenue");
      }
    },
    [toastSuccess, toastError]
  );

  const openCancelInvitationModal = useCallback((invitationId: string) => {
    pendingCancelRef.current = invitationId;
    cancelInvitationModal.open();
  }, []);

  const confirmCancelInvitation = useCallback(async () => {
    const invitationId = pendingCancelRef.current;
    if (!invitationId) return;
    try {
      await _delete(`/api/v1/organisation/invitations/${invitationId}`);
      await refetchInvitations();
      toastSuccess("L'invitation a été annulée");
    } catch (err: any) {
      toastError(err?.json?.data?.message || "Une erreur est survenue");
    }
  }, [refetchInvitations, toastSuccess, toastError]);

  const openRoleChangeModal = useCallback((userId: string, email: string, currentRole: "admin" | "member") => {
    setRoleChangeError(null);
    setPendingRoleChange({ userId, email, newRole: currentRole === "admin" ? "member" : "admin" });
    roleChangeModal.open();
  }, []);

  const confirmRoleChange = useCallback(async () => {
    const pending = pendingRoleChange;
    if (!pending) return;
    setRoleChangeError(null);
    try {
      await _put(`/api/v1/organisation/membres/${pending.userId}/role`, { role: pending.newRole });
      roleChangeModal.close();
      await refetchMembres();
      toastSuccess(
        pending.newRole === "admin"
          ? "L'utilisateur a été promu administrateur"
          : "L'utilisateur n'est plus administrateur"
      );
    } catch (err: any) {
      setRoleChangeError(err?.json?.data?.message || "Une erreur est survenue");
    }
  }, [pendingRoleChange, refetchMembres, toastSuccess]);

  const handleInvitationSuccess = useCallback(async () => {
    await refetchMembres();
    await refetchInvitations();
  }, [refetchMembres, refetchInvitations]);

  const filteredMembres = useMemo(() => {
    if (!membres) return [];
    if (!searchTerm) return membres;
    const term = searchTerm.toLowerCase();
    return membres.filter(
      (m) =>
        m.nom?.toLowerCase().includes(term) ||
        m.prenom?.toLowerCase().includes(term) ||
        m.email?.toLowerCase().includes(term)
    );
  }, [membres, searchTerm]);

  const filteredInvitations = useMemo(() => {
    if (!invitations) return [];
    if (!searchTerm) return invitations;
    const term = searchTerm.toLowerCase();
    return invitations.filter((inv) => inv.email?.toLowerCase().includes(term));
  }, [invitations, searchTerm]);

  const tableData = useMemo(() => {
    const membresRows = filteredMembres.map((m) => ({
      _id: m._id,
      rawData: {
        nom: `${m.nom ?? ""} ${m.prenom ?? ""}`.trim(),
        telephone: m.telephone ?? "",
        email: m.email,
        fonction: m.fonction ?? "",
        dateActivation: m.confirmed_at ?? m.created_at ?? "",
        actions: "",
      },
      element: {
        nom: (
          <span className={styles.nameCell}>
            <span>
              {m.nom} {m.prenom}
              {user?.email === m.email && <span className={styles.youSuffix}> (vous)</span>}
            </span>
            {m.organisation_role === "admin" && <AdminTag />}
          </span>
        ),
        telephone: <div className={styles.textCenter}>{m.telephone || "—"}</div>,
        email: <div className={styles.textCenter}>{m.email}</div>,
        fonction: (
          <div title={m.fonction || ""} className={styles.fonctionCell}>
            {m.fonction || "—"}
          </div>
        ),
        dateActivation: (
          <div className={styles.textCenter}>
            <ActivationDateCell dateString={m.confirmed_at ?? m.created_at} />
          </div>
        ),
        actions: (
          <div className={styles.actionsCell}>
            {user?.email !== m.email ? (
              <>
                <Button
                  iconId={m.organisation_role === "admin" ? "ri-shield-line" : "ri-shield-star-line"}
                  priority="tertiary no outline"
                  size="small"
                  title={
                    m.organisation_role === "admin" ? "Retirer le rôle administrateur" : "Promouvoir administrateur"
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    openRoleChangeModal(m._id, m.email, m.organisation_role ?? "member");
                  }}
                />
                <Button
                  iconId="ri-close-line"
                  priority="secondary"
                  size="small"
                  title="Retirer l'accès"
                  onClick={(e) => {
                    e.stopPropagation();
                    openDeleteMembreModal(m._id, m.email);
                  }}
                />
              </>
            ) : null}
          </div>
        ),
      },
    }));

    const invitationsRows = filteredInvitations.map((inv) => ({
      _id: inv._id,
      rawData: {
        nom: "",
        telephone: "",
        email: inv.email,
        fonction: "",
        dateActivation: "",
        actions: "",
      },
      element: {
        nom: (
          <span className={styles.invitationCell}>
            {inv.email}
            <Badge small noIcon severity="warning">
              En attente
            </Badge>
            {inv.role === "admin" && <AdminTag />}
          </span>
        ),
        telephone: <div className={styles.textCenter}>—</div>,
        email: <div className={styles.textCenter}>{inv.email}</div>,
        fonction: "—",
        dateActivation: <div className={styles.textCenter}>—</div>,
        actions: (
          <div className={styles.actionsCell}>
            <Button
              iconId="ri-mail-send-line"
              priority="tertiary no outline"
              size="small"
              title="Renvoyer l'invitation"
              onClick={(e) => {
                e.stopPropagation();
                handleResendInvitation(inv._id);
              }}
            />
            <Button
              iconId="ri-close-line"
              priority="secondary"
              size="small"
              title="Annuler l'invitation"
              onClick={(e) => {
                e.stopPropagation();
                openCancelInvitationModal(inv._id);
              }}
            />
          </div>
        ),
      },
    }));

    return [...membresRows, ...invitationsRows];
  }, [
    filteredMembres,
    filteredInvitations,
    user?.email,
    openDeleteMembreModal,
    openRoleChangeModal,
    handleResendInvitation,
    openCancelInvitationModal,
  ]);

  const isLoading = isLoadingMembres || isLoadingInvitations;

  // Redirect non-admin users after all hooks
  if (!isCfaAdmin) {
    router.replace("/cfa");
    return null;
  }

  return (
    <>
      <deleteMembreModal.Component
        title="Supprimer l'accès"
        buttons={[
          { children: "Annuler", doClosesModal: true, priority: "secondary" },
          {
            children: "Confirmer",
            doClosesModal: true,
            priority: "primary",
            onClick: confirmDeleteMembre,
          },
        ]}
      >
        Voulez-vous vraiment supprimer l&apos;accès de cet utilisateur ?
      </deleteMembreModal.Component>
      <cancelInvitationModal.Component
        title="Annuler l'invitation"
        buttons={[
          { children: "Annuler", doClosesModal: true, priority: "secondary" },
          {
            children: "Confirmer",
            doClosesModal: true,
            priority: "primary",
            onClick: confirmCancelInvitation,
          },
        ]}
      >
        Voulez-vous vraiment annuler cette invitation ?
      </cancelInvitationModal.Component>
      <roleChangeModal.Component
        title={pendingRoleChange?.newRole === "admin" ? "Promouvoir administrateur" : "Retirer le rôle administrateur"}
        buttons={[
          { children: "Annuler", doClosesModal: true, priority: "secondary" },
          {
            children: "Confirmer",
            priority: "primary",
            doClosesModal: false,
            nativeButtonProps: { type: "button" },
            onClick: confirmRoleChange,
          },
        ]}
      >
        {roleChangeError && (
          <Alert
            severity="error"
            title={roleChangeError}
            description=""
            small
            closable
            onClose={() => setRoleChangeError(null)}
            className="fr-mb-2w"
          />
        )}
        {pendingRoleChange?.newRole === "admin"
          ? `Voulez-vous vraiment promouvoir ${pendingRoleChange?.email} en administrateur ? Cette personne pourra gérer les utilisateurs de l'établissement.`
          : `Voulez-vous vraiment retirer le rôle administrateur à ${pendingRoleChange?.email} ? Cette personne ne pourra plus gérer les utilisateurs.`}
      </roleChangeModal.Component>
      <div>
        <h1 className={styles.title}>Rôles et habilitations</h1>
        <p className={styles.description}>
          Retrouvez ici l&apos;ensemble des utilisateurs habilités à consulter les données des apprenants, utiliser le
          service et demander des collaborations avec les Missions Locales.
        </p>

        <div className={styles.topBar}>
          <div className={styles.searchWrapper}>
            <SearchBar
              label="Cherchez un utilisateur"
              renderInput={({ id, className, placeholder }) => (
                <input
                  id={id}
                  className={`${className} ${styles.searchInput}`}
                  placeholder={placeholder}
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              )}
            />
          </div>
          <Button iconId="ri-add-line" iconPosition="right" onClick={() => setIsInvitationPanelOpen(true)}>
            Ajouter un utilisateur
          </Button>
        </div>

        {isLoading ? (
          <div className={styles.skeletonContainer}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className={styles.skeletonItem} />
            ))}
          </div>
        ) : (
          <FullTable data={tableData} columns={COLUMNS} emptyMessage="Aucun utilisateur trouvé" hasPagination={false} />
        )}
      </div>
      <InvitationSidePanel
        isOpen={isInvitationPanelOpen}
        onClose={() => setIsInvitationPanelOpen(false)}
        onSuccess={handleInvitationSuccess}
      />
    </>
  );
}
