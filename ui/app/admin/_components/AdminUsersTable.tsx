"use client";

import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Table } from "@codegouvfr/react-dsfr/Table";
import { type IUsersMigrationJson } from "shared";

import { formatDate } from "@/app/_utils/date.utils";
import { USER_STATUS_LABELS } from "@/common/constants/usersConstants";

import styles from "./admin-users-table.module.scss";

export function AdminUsersTable({ users, caption }: { users: IUsersMigrationJson[]; caption: string }) {
  return (
    <Table
      caption={caption}
      bordered
      headers={[
        "Nom",
        "Prénom",
        "Courriel",
        "Téléphone",
        "Fonction",
        "Statut du compte",
        "Création",
        "Dernière connexion",
      ]}
      data={users.map((user) => [
        user.nom,
        user.prenom,
        user.email,
        user.telephone || <span className={styles.missing}>Non renseigné</span>,
        user.fonction || <span className={styles.missing}>Non renseignée</span>,
        <Badge key="statut" severity={user.account_status === "CONFIRMED" ? "success" : "warning"} small>
          {USER_STATUS_LABELS[user.account_status] ?? user.account_status}
        </Badge>,
        user.created_at ? formatDate(user.created_at) : <span className={styles.missing}>Inconnue</span>,
        user.last_connection ? (
          formatDate(user.last_connection)
        ) : (
          <span className={styles.missing}>Jamais connecté</span>
        ),
      ])}
    />
  );
}
