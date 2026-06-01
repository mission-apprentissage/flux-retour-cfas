import { fr } from "@codegouvfr/react-dsfr";

import type { Adresse } from "./connexion-invitation.types";
import { formatAdresseLong } from "./connexion-invitation.types";
import styles from "./OrganismeCard.module.scss";

type OrganismeCardProps = {
  nom: string | null;
  adresse: Adresse;
  uai: string | null;
  siret: string;
};

export function OrganismeCard({ nom, adresse, uai, siret }: OrganismeCardProps) {
  return (
    <div className={styles.card}>
      <i className={`${fr.cx("fr-icon-bank-line")} ${styles.icon}`} aria-hidden />
      <div className={styles.info}>
        <strong className={styles.nom}>{nom ?? "Organisme inconnu"}</strong>
        {adresse && <span className={styles.adresse}>{formatAdresseLong(adresse)}</span>}
        {(uai || siret) && (
          <span className={styles.ident}>
            {uai && (
              <>
                UAI <span className={styles.identStrong}>{uai}</span>
              </>
            )}
            {uai && siret && " | "}
            {siret && (
              <>
                SIRET <span className={styles.identStrong}>{siret}</span>
              </>
            )}
          </span>
        )}
      </div>
    </div>
  );
}
