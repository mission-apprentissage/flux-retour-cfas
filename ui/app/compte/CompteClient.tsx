"use client";

import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { SideMenu, type SideMenuProps } from "@codegouvfr/react-dsfr/SideMenu";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

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

import { UnsavedChangesProvider, useUnsavedChanges } from "../_components/UnsavedChangesContext";
import { useAuth } from "../_context/UserContext";

import styles from "./CompteClient.module.css";
import { MonCompteSection } from "./MonCompteSection";

const unsavedChangesModal = createModal({ id: "compte-unsaved-changes", isOpenedByDefault: false });

export function CompteClient() {
  return (
    <UnsavedChangesProvider>
      <CompteHub />
    </UnsavedChangesProvider>
  );
}

function CompteHub() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const { isDirty, setDirty } = useUnsavedChanges();
  const pendingNavigation = useRef<(() => void) | null>(null);
  // Vrai pendant une navigation déjà confirmée via notre modale : empêche le prompt natif (beforeunload)
  // de s'afficher par-dessus, le listener étant encore attaché au moment où l'on déclenche la navigation.
  const bypassGuard = useRef(false);

  const settingsTab = getCompteSettingsTab(user?.organisation);
  // L'onglet actif est dérivé du query param (lisible au SSR) → pas de flash au chargement.
  const activeTab =
    settingsTab && searchParams?.get(COMPTE_TAB_PARAM) === COMPTE_SETTINGS_TAB ? "parametres" : "mon-compte";

  // Garde « modifications non enregistrées » : intercepte les départs (changement d'onglet, lien du header,
  // rafraîchissement/fermeture) tant qu'un formulaire est modifié, et demande confirmation via une modale DSFR.
  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (bypassGuard.current) return;
      event.preventDefault();
      event.returnValue = "";
    };

    const handleClickCapture = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
      const anchor = (event.target as HTMLElement | null)?.closest("a");
      const href = anchor?.getAttribute("href");
      if (!anchor || !href || anchor.target === "_blank" || /^(mailto:|tel:|#)/.test(href)) return;

      const url = new URL(anchor.href, window.location.origin);
      if (url.origin !== window.location.origin) return;
      // Pas d'interception si on reste exactement sur la même URL.
      if (url.pathname + url.search === window.location.pathname + window.location.search) return;

      event.preventDefault();
      pendingNavigation.current = () => {
        window.location.href = url.href;
      };
      unsavedChangesModal.open();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleClickCapture, true);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleClickCapture, true);
    };
  }, [isDirty]);

  const requestNavigation = (action: () => void) => {
    if (isDirty) {
      pendingNavigation.current = action;
      unsavedChangesModal.open();
    } else {
      action();
    }
  };

  const confirmLeave = () => {
    bypassGuard.current = true;
    setDirty(false);
    unsavedChangesModal.close();
    const action = pendingNavigation.current;
    pendingNavigation.current = null;
    action?.();
  };

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
      <unsavedChangesModal.Component
        title="Modifications non enregistrées"
        buttons={[
          {
            children: "Annuler",
            priority: "secondary" as const,
            doClosesModal: true,
            onClick: () => {
              pendingNavigation.current = null;
            },
          },
          {
            children: "Quitter sans enregistrer",
            priority: "primary" as const,
            doClosesModal: false,
            onClick: confirmLeave,
          },
        ]}
      >
        <p>
          Vous avez des modifications qui ne sont pas enregistrées. Souhaitez-vous quitter sans enregistrer ces
          informations&nbsp;?
        </p>
      </unsavedChangesModal.Component>

      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-3">
          <SideMenu align="left" burgerMenuButtonText="Mon compte" sticky items={items} />
          <button type="button" className={styles.logoutButton} onClick={() => requestNavigation(logout)}>
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
