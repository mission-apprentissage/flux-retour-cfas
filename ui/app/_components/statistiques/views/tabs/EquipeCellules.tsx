import { formatDistanceToNow } from "date-fns";
import { fr as frLocale } from "date-fns/locale";

import { CopyButton } from "../../ui/CopyButton";
import { formatDateCourte } from "../../utils";

import styles from "./EquipeTab.module.css";

const CIVILITES: Record<string, string> = { Monsieur: "M.", Madame: "Mme" };

export function NomMembre({
  civility,
  nom,
  prenom,
}: {
  civility?: string | null;
  nom?: string | null;
  prenom?: string | null;
}) {
  const ligne = [civility ? CIVILITES[civility] : null, nom?.toUpperCase()].filter(Boolean).join(" ");
  if (!ligne && !prenom) return <span className={styles.vide}>-</span>;
  return (
    <strong className={styles.nom}>
      {ligne}
      {ligne && prenom && <br />}
      {prenom}
    </strong>
  );
}

export function CourrielCopiable({ email }: { email?: string | null }) {
  if (!email) return <>-</>;
  return (
    <span className={styles.courriel}>
      <a href={`mailto:${email}`} className="fr-link">
        {email}
      </a>
      <CopyButton value={email} title="Copier l'adresse courriel" />
    </span>
  );
}

export function DateRelative({ date, vide }: { date: string | null; vide: string }) {
  if (!date) return <span className={styles.vide}>{vide}</span>;
  return (
    <span className={styles.date}>
      <span>{formatDateCourte(date)}</span>
      <span className={styles.relatif}>
        {formatDistanceToNow(new Date(date), { locale: frLocale, addSuffix: true })}
      </span>
    </span>
  );
}

export function EtatVideEquipe({ colonnes, message }: { colonnes: number; message: string }) {
  return (
    <tr>
      <td colSpan={colonnes} className={styles.celluleVide}>
        <p className={styles.etatVide}>
          <span className="fr-icon-information-fill fr-icon--sm" aria-hidden="true" />
          {message}
        </p>
      </td>
    </tr>
  );
}
