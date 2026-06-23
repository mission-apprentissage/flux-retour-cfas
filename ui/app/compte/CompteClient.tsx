"use client";

import { SideMenu, type SideMenuProps } from "@codegouvfr/react-dsfr/SideMenu";
import { useSearchParams } from "next/navigation";

import CfaParametresClient from "@/app/(cfa)/cfa/parametres/ParametresClient";
import MlParametresClient from "@/app/(mission-locale)/mission-locale/parametres/ParametresClient";
import { _post } from "@/common/httpClient";
import {
  COMPTE_ACCOUNT_HREF,
  COMPTE_SETTINGS_HREF,
  COMPTE_SETTINGS_TAB,
  COMPTE_TAB_PARAM,
  getCompteSettingsTab,
} from "@/common/utils/compteSettings";

import { useAuth } from "../_context/UserContext";

import styles from "./CompteClient.module.css";
import { MonCompteSection } from "./MonCompteSection";

export function CompteClient() {
  const { user } = useAuth();
  const searchParams = useSearchParams();

  const settingsTab = getCompteSettingsTab(user?.organisation);
  // L'onglet actif est dérivé du query param (lisible au SSR) → pas de flash au chargement.
  const activeTab =
    settingsTab && searchParams?.get(COMPTE_TAB_PARAM) === COMPTE_SETTINGS_TAB ? "parametres" : "mon-compte";

  const logout = async () => {
    await _post("/api/v1/auth/logout");
    window.location.href = "/";
  };

  const items: SideMenuProps.Item[] = [
    {
      text: "Mon compte",
      isActive: activeTab === "mon-compte",
      linkProps: { href: COMPTE_ACCOUNT_HREF },
    },
    ...(settingsTab
      ? [
          {
            text: settingsTab.shortLabel,
            isActive: activeTab === "parametres",
            linkProps: { href: COMPTE_SETTINGS_HREF },
          },
        ]
      : []),
  ];

  return (
    <div className="fr-container fr-py-4w">
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-3">
          <SideMenu align="left" burgerMenuButtonText="Mon compte" sticky items={items} />
          <button type="button" className={styles.logoutButton} onClick={logout}>
            <i className="fr-icon-logout-box-r-line fr-icon--sm" aria-hidden="true" />
            Me déconnecter
          </button>
        </div>

        <div className="fr-col-12 fr-col-md-9">
          {activeTab === "parametres" && settingsTab?.kind === "mission-locale" && <MlParametresClient />}
          {activeTab === "parametres" && settingsTab?.kind === "cfa-erp" && <CfaParametresClient />}
          {activeTab === "mon-compte" && <MonCompteSection />}
        </div>
      </div>
    </div>
  );
}
