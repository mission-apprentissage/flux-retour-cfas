"use client";

import { Breadcrumb } from "@codegouvfr/react-dsfr/Breadcrumb";
import { Box, Stack, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import UserForm from "@/app/_components/admin/UserForm";
import { PageWithSidebarSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { SuspenseWrapper } from "@/app/_components/suspense/SuspenseWrapper";
import { _get } from "@/common/httpClient";

interface UserAdminClientProps {
  id: string;
}

export default function UserAdminClient({ id }: UserAdminClientProps) {
  const router = useRouter();

  const { data, refetch: refetchUser } = useQuery(["user", id], () => _get(`/api/v1/admin/users/${id}`), {
    enabled: !!id,
    suspense: true,
    useErrorBoundary: true,
  });

  const user = data?.user;

  return (
    <SuspenseWrapper fallback={<PageWithSidebarSkeleton />}>
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
          <UserForm user={user} onUpdate={() => refetchUser} onDelete={() => router.push("/admin/users")} />
        </Stack>
      </Box>
    </SuspenseWrapper>
  );
}
