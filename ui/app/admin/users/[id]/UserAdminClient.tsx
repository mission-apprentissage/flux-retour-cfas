"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Breadcrumb } from "@codegouvfr/react-dsfr/Breadcrumb";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { Box, Stack, Typography } from "@mui/material";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import UserForm from "@/app/_components/admin/UserForm";
import { PageWithSidebarSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { SuspenseWrapper } from "@/app/_components/suspense/SuspenseWrapper";
import { _get, _put } from "@/common/httpClient";

interface UserAdminClientProps {
  id: string;
}

const adminRoleChangeModal = createModal({
  id: "admin-role-change",
  isOpenedByDefault: false,
});

export default function UserAdminClient({ id }: UserAdminClientProps) {
  const router = useRouter();
  const [pendingRole, setPendingRole] = useState<"admin" | "member" | null>(null);
  const [roleChangeError, setRoleChangeError] = useState<string | null>(null);
  const [roleChangeSuccess, setRoleChangeSuccess] = useState<string | null>(null);

  const { data, refetch: refetchUser } = useSuspenseQuery({
    queryKey: ["user", id],
    queryFn: () => _get(`/api/v1/admin/users/${id}`),
  });

  const user = data?.user;
  const isCfa = user?.organisation?.type === "ORGANISME_FORMATION";
  const currentRole = user?.organisation_role ?? "member";

  const openRoleChangeModal = useCallback((newRole: "admin" | "member") => {
    setRoleChangeError(null);
    setRoleChangeSuccess(null);
    setPendingRole(newRole);
    adminRoleChangeModal.open();
  }, []);

  const confirmRoleChange = useCallback(async () => {
    const newRole = pendingRole;
    if (!newRole) return;
    setRoleChangeError(null);
    try {
      await _put(`/api/v1/admin/users/${id}/role`, { role: newRole });
      adminRoleChangeModal.close();
      await refetchUser();
      setRoleChangeSuccess(
        newRole === "admin" ? "L'utilisateur a été promu administrateur" : "L'utilisateur n'est plus administrateur"
      );
    } catch (err: any) {
      setRoleChangeError(err?.json?.data?.message || "Une erreur est survenue");
    }
  }, [id, pendingRole, refetchUser]);

  return (
    <SuspenseWrapper fallback={<PageWithSidebarSkeleton />}>
      <adminRoleChangeModal.Component
        title={pendingRole === "admin" ? "Promouvoir administrateur" : "Retirer le rôle administrateur"}
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
        {pendingRole === "admin"
          ? `Voulez-vous vraiment promouvoir ${user?.email} en administrateur ? Cette personne pourra gérer les utilisateurs de l'établissement.`
          : `Voulez-vous vraiment retirer le rôle administrateur à ${user?.email} ? Cette personne ne pourra plus gérer les utilisateurs.`}
      </adminRoleChangeModal.Component>
      <Box sx={{ pl: 2 }}>
        <Breadcrumb
          currentPageLabel="Fiche utilisateur"
          segments={[
            {
              label: "Accueil",
              linkProps: {
                href: "/",
              },
            },
            {
              label: "Gestion des utilisateurs",
              linkProps: {
                href: "/admin/users",
              },
            },
          ]}
        />
        <Stack spacing={1} sx={{ maxWidth: "48rem" }}>
          <Typography variant="h1" component="h1">
            {user.prenom} {user.nom}
          </Typography>
          <Box sx={{ color: "text.secondary" }}>
            <Typography variant="body2">
              Date de création du compte : {new Date(user.created_at).toLocaleString()}
            </Typography>
            <Typography variant="body2">
              Date de dernière connexion :{" "}
              {user.last_connection ? new Date(user.last_connection).toLocaleString() : "jamais connecté"}
            </Typography>
          </Box>
          {isCfa && (
            <Box
              sx={{
                mt: 2,
                p: 2,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                Rôle au sein du CFA
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Badge noIcon severity={currentRole === "admin" ? "info" : "new"}>
                  {currentRole === "admin" ? "Administrateur" : "Non-administrateur"}
                </Badge>
                <Button
                  iconId={currentRole === "admin" ? "ri-shield-line" : "ri-shield-star-line"}
                  priority="secondary"
                  size="small"
                  onClick={() => openRoleChangeModal(currentRole === "admin" ? "member" : "admin")}
                >
                  {currentRole === "admin" ? "Retirer le rôle administrateur" : "Promouvoir administrateur"}
                </Button>
              </Box>
              {roleChangeSuccess && (
                <Alert
                  severity="success"
                  title={roleChangeSuccess}
                  description=""
                  small
                  closable
                  onClose={() => setRoleChangeSuccess(null)}
                  className="fr-mt-2w"
                />
              )}
            </Box>
          )}
          <UserForm user={user} onUpdate={() => refetchUser} onDelete={() => router.push("/admin/users")} />
        </Stack>
      </Box>
    </SuspenseWrapper>
  );
}
