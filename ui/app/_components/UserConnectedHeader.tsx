"use client";

import { CRISP_FAQ, ORGANISATION_TYPE } from "shared";

import { PAGES } from "@/app/_utils/routes.utils";
import { _post } from "@/common/httpClient";
import { AuthContext } from "@/common/internal/AuthContext";
import { getAccountLabel } from "@/common/utils/accountUtils";
import { COMPTE_ACCOUNT_HREF, COMPTE_SETTINGS_HREF, getCompteSettingsTab } from "@/common/utils/compteSettings";

import { useAuth } from "../_context/UserContext";

import { DropdownMenu, DropdownMenuButton, DropdownMenuLink, DropdownMenuSubheader } from "./common/DropdownMenu";
import styles from "./UserConnectedHeader.module.css";

export const UserConnectedHeader = () => {
  const { user } = useAuth();

  const isCfa = user?.organisation?.type === ORGANISATION_TYPE.ORGANISME_FORMATION;
  const isMissionLocale = user?.organisation?.type === ORGANISATION_TYPE.MISSION_LOCALE;
  // Onglet "Paramètres" géré par le hub /compte (ML, CFA-beta), source unique partagée avec le hub.
  const settingsTab = getCompteSettingsTab(user?.organisation);

  // Nom de l'organisation affiché sous le nom de l'utilisateur : le nom de l'organisme pour un CFA,
  // le nom de la Mission Locale pour un agent ML.
  const organisationLabel = isCfa
    ? user?.organisation_nom
    : user?.organisation?.type === "MISSION_LOCALE"
      ? `Mission Locale ${user.organisation.nom}`
      : undefined;

  // Affichage à deux lignes (prénom/nom au-dessus de l'organisation), identique entre CFA et ML.
  const showUserNameHeader = (isCfa || isMissionLocale) && !!user?.prenom && !!user?.nom;

  const logout = async () => {
    await _post("/api/v1/auth/logout");
    window.location.href = "/";
  };

  const hasRight = (entry: string) => {
    const organisationType = user?.organisation?.type;
    switch (entry) {
      case "ROLES":
        return organisationType !== ORGANISATION_TYPE.MISSION_LOCALE && !isCfa;
      case "TRANSMISSIONS":
        return organisationType === ORGANISATION_TYPE.ORGANISME_FORMATION;
      default:
        return false;
    }
  };

  if (!user) {
    return null;
  }

  const settingsUrl = settingsTab ? COMPTE_SETTINGS_HREF : undefined;

  const label = showUserNameHeader ? (
    <span className={styles.userLabel}>
      <span className={styles.userName}>
        {`${user.prenom.charAt(0).toUpperCase()}${user.prenom.slice(1)} ${user.nom.charAt(0).toUpperCase()}.`}
      </span>
      {organisationLabel && (
        <span className={styles.organisation} title={organisationLabel}>
          {organisationLabel}
        </span>
      )}
    </span>
  ) : (
    <span className={styles.accountLabel} title={getAccountLabel(user as AuthContext)}>
      {getAccountLabel(user as AuthContext)}
    </span>
  );

  return (
    <DropdownMenu label={label} buttonIconId="ri-account-circle-fill">
      {() => (
        <>
          <DropdownMenuLink href={COMPTE_ACCOUNT_HREF} icon="ri-account-circle-fill">
            Mon compte
          </DropdownMenuLink>

          {settingsUrl && (
            <DropdownMenuLink href={settingsUrl} icon="ri-settings-5-fill">
              {settingsTab?.label ?? "Paramètres"}
            </DropdownMenuLink>
          )}

          {hasRight("ROLES") && (
            <DropdownMenuLink href="/organisation/membres" target="_self" icon="fr-icon-team-fill">
              Rôles et habilitations
            </DropdownMenuLink>
          )}

          {hasRight("TRANSMISSIONS") && (
            <DropdownMenuLink href="/transmissions" icon="fr-icon-send-plane-fill">
              Transmissions
            </DropdownMenuLink>
          )}

          {isCfa && (user?.organisation_role === "admin" || user?.impersonating === true) && (
            <DropdownMenuLink href="/cfa/roles-habilitations" icon="fr-icon-team-fill">
              Rôles et habilitations
            </DropdownMenuLink>
          )}

          {isCfa && (
            <>
              <DropdownMenuSubheader>Aide et ressources</DropdownMenuSubheader>
              <DropdownMenuLink href={CRISP_FAQ} target="_blank" icon="fr-icon-question-fill">
                Centre d&apos;aide
              </DropdownMenuLink>
              <DropdownMenuLink href={PAGES.static.glossaire.getPath()} icon="fr-icon-book-2-fill">
                Glossaire
              </DropdownMenuLink>
              <DropdownMenuLink href={PAGES.static.referencementOrganisme.getPath()} icon="fr-icon-building-fill">
                Référencement organisme
              </DropdownMenuLink>
            </>
          )}

          <DropdownMenuButton onClick={logout} icon="fr-icon-logout-box-r-fill" separator danger>
            Déconnexion
          </DropdownMenuButton>
        </>
      )}
    </DropdownMenu>
  );
};
