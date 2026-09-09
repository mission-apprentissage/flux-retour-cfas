import { Badge } from "@codegouvfr/react-dsfr/Badge";
import NavLink from "next/link";

import { USER_STATUS_LABELS } from "@/common/constants/usersConstants";

import styles from "./UserTableCells.module.css";

interface UserTableCellsProps {
  user: any;
  displayName: string;
}

export function UserNameCell({ user }: Pick<UserTableCellsProps, "user">) {
  return (
    <div className={styles.cell}>
      <p className={styles.name}>
        {user.prenom} {user.nom}
      </p>
      <p className={styles.caption}>
        {user.email}
        {user.fonction ? ` - ${user.fonction}` : ""}
      </p>
    </div>
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
    <div className={styles.cell}>
      {organisationId ? (
        <NavLink
          href={`/organismes/${organisationId}`}
          className={`${styles.organisation} ${styles.organisationLink}`}
          title={displayName}
        >
          {displayName}
        </NavLink>
      ) : (
        <p className={styles.organisation} title={displayName}>
          {displayName}
        </p>
      )}
      {isOrganismeFormation && identifiants.length > 0 ? (
        <p className={`${styles.caption} ${styles.captionEllipsis}`}>{identifiants.join(" • ")}</p>
      ) : (
        user.organisation?.type && (
          <p className={`${styles.caption} ${styles.captionEllipsis}`}>{user.organisation.type}</p>
        )
      )}
    </div>
  );
}

export function CreatedAtCell({ user }: Pick<UserTableCellsProps, "user">) {
  return (
    <div className={styles.cell}>
      <p className={styles.name}>
        Créé le {user.created_at ? new Date(user.created_at).toLocaleDateString("fr-FR") : "N/A"}
      </p>
      <p className={styles.caption}>
        {user.last_connection
          ? `Dernière connexion le ${new Date(user.last_connection).toLocaleDateString("fr-FR")}`
          : "Jamais connecté"}
      </p>
    </div>
  );
}

export function StatusCell({ user }: Pick<UserTableCellsProps, "user">) {
  return (
    <Badge severity={user.account_status === "CONFIRMED" ? "success" : "warning"} small className={styles.badge}>
      {USER_STATUS_LABELS[user.account_status] || user.account_status}
    </Badge>
  );
}

export function ActionsCell({ user }: Pick<UserTableCellsProps, "user">) {
  return (
    <NavLink href={`/admin/users/${user._id}`} className={styles.actions}>
      <i className="ri-arrow-right-line arrow-icon" />
    </NavLink>
  );
}
