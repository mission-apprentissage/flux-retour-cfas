import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Box, Stack, Typography } from "@mui/material";
import NavLink from "next/link";

import { USER_STATUS_LABELS } from "@/common/constants/usersConstants";

interface UserTableCellsProps {
  user: any;
  displayName: string;
}

export function UserNameCell({ user }: Pick<UserTableCellsProps, "user">) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="body1" sx={{ lineHeight: 1.3 }}>
        {user.prenom} {user.nom}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
        {user.email}
        {user.fonction ? ` - ${user.fonction}` : ""}
      </Typography>
    </Stack>
  );
}

export function OrganisationCell({ user, displayName }: UserTableCellsProps) {
  const isOrganismeFormation = user.organisation?.type === "ORGANISME_FORMATION";
  const uai = user.organisation?.uai;
  const siret = user.organisation?.siret;
  const organisationId = user.organisation?.organisme?._id;

  const identifiants: string[] = [];
  if (isOrganismeFormation) {
    if (uai) identifiants.push(`UAI: ${uai}`);
    if (siret) identifiants.push(`SIRET: ${siret}`);
  }

  return (
    <Stack spacing={0.5}>
      {organisationId ? (
        <Typography
          component={NavLink}
          href={`/organismes/${organisationId}`}
          variant="body2"
          sx={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            lineHeight: 1.3,
            fontSize: "0.875rem",
            fontWeight: 500,
            textDecoration: "none",
            color: "primary.main",
            "&:hover": {
              textDecoration: "underline",
            },
          }}
          title={displayName}
        >
          {displayName}
        </Typography>
      ) : (
        <Typography
          variant="body2"
          sx={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            lineHeight: 1.3,
            fontSize: "0.875rem",
            fontWeight: 500,
          }}
          title={displayName}
        >
          {displayName}
        </Typography>
      )}
      {isOrganismeFormation && identifiants.length > 0 ? (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontSize: "0.75rem",
            lineHeight: 1.2,
          }}
        >
          {identifiants.join(" • ")}
        </Typography>
      ) : (
        user.organisation?.type && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontSize: "0.75rem",
              lineHeight: 1.2,
            }}
          >
            {user.organisation.type}
          </Typography>
        )
      )}
    </Stack>
  );
}

export function CreatedAtCell({ user }: Pick<UserTableCellsProps, "user">) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="body1">
        Créé le {user.created_at ? new Date(user.created_at).toLocaleDateString("fr-FR") : "N/A"}
      </Typography>
      <Typography variant="caption" color="var(--text-default-grey)" sx={{ fontSize: "0.75rem", lineHeight: 1.2 }}>
        {user.last_connection
          ? `Dernière connexion le ${new Date(user.last_connection).toLocaleDateString("fr-FR")}`
          : "Jamais connecté"}
      </Typography>
    </Stack>
  );
}

export function StatusCell({ user }: Pick<UserTableCellsProps, "user">) {
  return (
    <Badge
      severity={user.account_status === "CONFIRMED" ? "success" : "warning"}
      small
      style={{ fontSize: "0.625rem" }}
    >
      {USER_STATUS_LABELS[user.account_status] || user.account_status}
    </Badge>
  );
}

export function ActionsCell({ user }: Pick<UserTableCellsProps, "user">) {
  return (
    <Box
      component={NavLink}
      href={`/admin/users/${user._id}`}
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundImage: "none",
      }}
    >
      <i className="ri-arrow-right-line arrow-icon" />
    </Box>
  );
}
