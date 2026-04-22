"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocalStorage } from "usehooks-ts";

import { LOCAL_STORAGE_KEYS } from "@/app/_constants/localStorage";
import { useCfaAdmin } from "@/app/_hooks/useCfaAdmin";
import { _get } from "@/common/httpClient";

import styles from "./CfaInviteBanner.module.css";

const CFA_TABS_WITH_BANNER = ["/cfa/collaborations", "/cfa/effectifs"] as const;
const MAX_MEMBERS_BEFORE_HIDE = 1;
const MAX_INVITATIONS_BEFORE_HIDE = 1;

export function CfaInviteBanner() {
  const { isCfaAdmin } = useCfaAdmin();
  const pathname = usePathname();
  const [dismissed, setDismissed] = useLocalStorage(LOCAL_STORAGE_KEYS.CFA_INVITE_BANNER_DISMISSED, false);

  const isOnCfaTab =
    pathname === "/cfa" ||
    CFA_TABS_WITH_BANNER.some((route) => pathname === route || pathname?.startsWith(`${route}/`));

  const shouldFetch = isCfaAdmin && isOnCfaTab && !dismissed;

  const { data: membres } = useQuery<{ length: number }[]>({
    queryKey: ["organisation-membres"],
    queryFn: () => _get("/api/v1/organisation/membres"),
    enabled: shouldFetch,
  });

  const isUnderMembersCap = !!membres && membres.length <= MAX_MEMBERS_BEFORE_HIDE;

  const { data: invitations } = useQuery<{ length: number }[]>({
    queryKey: ["organisation-invitations"],
    queryFn: () => _get("/api/v1/organisation/invitations"),
    enabled: shouldFetch && isUnderMembersCap,
  });

  if (!shouldFetch) return null;
  if (!membres || !invitations) return null;
  if (membres.length > MAX_MEMBERS_BEFORE_HIDE || invitations.length > MAX_INVITATIONS_BEFORE_HIDE) return null;

  const handleDismiss = () => setDismissed(true);

  return (
    <div className={styles.banner} role="region" aria-label="Invitation de collègues">
      <div className={`fr-container ${styles.bannerInner}`}>
        <div className={styles.bannerContent}>
          <span className={`fr-icon-user-add-fill ${styles.bannerIcon}`} aria-hidden="true" />
          <div className={styles.bannerText}>
            <span className={styles.bannerTitle}>Invitez vos collègues à utiliser le Tableau de bord</span>
            <span className={styles.bannerDescription}>
              Ne travaillez pas seul, donnez accès au Tableau de bord de l&apos;apprentissage à vos collègues dans votre
              établissement. Invitez de nouveaux utilisateurs sur votre outil pour accompagner les jeunes en rupture de
              contrat.
            </span>
            <Link href="/cfa/roles-habilitations" className={styles.bannerLink}>
              Invitez de nouveaux utilisateurs
            </Link>
          </div>
        </div>
        <button className={styles.closeButton} onClick={handleDismiss} aria-label="Fermer">
          <span className="fr-icon-close-line" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
