"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Breadcrumb } from "@codegouvfr/react-dsfr/Breadcrumb";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import UserForm from "@/app/_components/admin/UserForm";
import { PageWithSidebarSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { SuspenseWrapper } from "@/app/_components/suspense/SuspenseWrapper";
import { _get, _put } from "@/common/httpClient";

import styles from "./UserAdminClient.module.css";

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
      <div className={styles.page}>
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
        <div className={styles.content}>
          <h1 className={styles.title}>
            {user.prenom} {user.nom}
          </h1>
          <div className={styles.meta}>
            <p className={styles.metaLine}>Date de création du compte : {new Date(user.created_at).toLocaleString()}</p>
            <p className={styles.metaLine}>
              Date de dernière connexion :{" "}
              {user.last_connection ? new Date(user.last_connection).toLocaleString() : "jamais connecté"}
            </p>
          </div>
          {isCfa && (
            <div className={styles.roleCard}>
              <p className={styles.roleCardTitle}>Rôle au sein du CFA</p>
              <div className={styles.roleCardRow}>
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
              </div>
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
            </div>
          )}
          <UserForm user={user} onUpdate={() => refetchUser} onDelete={() => router.push("/admin/users")} />
        </div>
      </div>
    </SuspenseWrapper>
  );
}
