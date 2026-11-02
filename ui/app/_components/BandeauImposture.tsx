"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { useState } from "react";

import { _delete } from "@/common/httpClient";
import { AuthContext } from "@/common/internal/AuthContext";
import { getAccountLabel } from "@/common/utils/accountUtils";

import { useAuth } from "../_context/UserContext";

import styles from "./BandeauImposture.module.css";

function getCibleLabel(user: AuthContext): string {
  const { organisation } = user;
  if (organisation.type === "ORGANISME_FORMATION") {
    return user.organisation_nom ? `du CFA ${user.organisation_nom}` : "d'un CFA";
  }
  if (organisation.type === "MISSION_LOCALE") {
    return organisation.nom ? `de la Mission Locale ${organisation.nom}` : "d'une Mission Locale";
  }
  return `: ${getAccountLabel(user)}`;
}

export function BandeauImposture() {
  const { user } = useAuth();
  const [enCours, setEnCours] = useState(false);

  if (!user?.impersonating) return null;

  const quitter = async () => {
    setEnCours(true);
    try {
      await _delete("/api/v1/admin/impersonate");
      window.location.href = "/";
    } catch {
      setEnCours(false);
    }
  };

  return (
    <div className={styles.bandeau} role="region" aria-label="Imposture en cours">
      <div className={`fr-container ${styles.inner}`}>
        <div className={styles.content}>
          <span className={`fr-icon-eye-fill ${styles.icon}`} aria-hidden="true" />
          <p className={styles.texte}>
            <strong>Vous voyez l&apos;interface {getCibleLabel(user)}</strong>{" "}
            {user.readOnly && "Cette interface est en lecture seule. "}
            Quittez cette vue pour revenir à votre outil
          </p>
        </div>
        <Button
          size="small"
          iconId="fr-icon-logout-box-r-line"
          iconPosition="right"
          className={styles.bouton}
          onClick={quitter}
          disabled={enCours}
        >
          Quitter cette vue
        </Button>
      </div>
    </div>
  );
}
