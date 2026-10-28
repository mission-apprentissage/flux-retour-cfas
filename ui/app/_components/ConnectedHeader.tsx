"use client";

import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Header as DsfrHeader } from "@codegouvfr/react-dsfr/Header";
import { MainNavigationProps } from "@codegouvfr/react-dsfr/MainNavigation";
import { usePathname } from "next/navigation";
import { Suspense, useState } from "react";
import { CRISP_FAQ, ORGANISATION_TYPE } from "shared";

import { PAGES } from "@/app/_utils/routes.utils";
import { STATS_NAV_ITEMS, StatsFiltersQueryReader } from "@/app/suivi-des-indicateurs/navigation";
import { PRODUCT_NAME_TITLE } from "@/common/constants/product";
import { getUserOrganismeId } from "@/common/internal/AuthContext";

import { useAuth } from "../_context/UserContext";
import { usePlausibleAppTracking } from "../_hooks/plausible";

import styles from "./ConnectedHeader.module.css";
import { Impersonate } from "./Impersonate";
import { useCfaUnreadNotificationsCount } from "./ruptures/cfa/hooks";
import { useMlCompteursOnglets } from "./ruptures/shared/hooks";
import { UserConnectedHeader } from "./UserConnectedHeader";

const STATS_NAV_ORGANISATION_TYPES: ReadonlyArray<string> = [
  ORGANISATION_TYPE.DREETS,
  ORGANISATION_TYPE.DDETS,
  ORGANISATION_TYPE.ARML,
  ORGANISATION_TYPE.ADMINISTRATEUR,
];

/** Menu « Admin » de la maquette, complété des pages admin qu'elle ne mentionne pas pour ne pas les perdre. */
const ADMIN_MENU_LINKS = [
  { text: "Impostures", href: "/admin/impostures" },
  { text: "Gestion des utilisateurs", href: "/admin/users" },
  { text: "Gestion des réseaux", href: "/admin/reseaux" },
  { text: "Toutes les transmissions", href: "/admin/transmissions" },
  { text: "Fusion des organismes", href: "/admin/fusion-organismes" },
  { text: "Organismes absents du référentiel", href: "/admin/organismes/gestion" },
  { text: "Listes de contacts Brevo", href: "/admin/brevo-contacts" },
  { text: "Recherche d'un organisme", href: "/admin/organismes/recherche" },
  { text: "Tous les organismes", href: "/organismes" },
];

function OngletAvecCompteur({ label, compteur }: { label: string; compteur: number | undefined }) {
  return (
    <span className={styles.navLabel}>
      {label}
      {compteur !== undefined && (
        <>
          <Badge as="span" small noIcon className={styles.compteur}>
            {compteur}
          </Badge>
          <span className="fr-sr-only">{compteur > 1 ? " dossiers à traiter" : " dossier à traiter"}</span>
        </>
      )}
    </span>
  );
}

export function ConnectedHeader({ withNav = true }: { withNav?: boolean }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const { trackPlausibleEvent } = usePlausibleAppTracking();

  const [statsFiltersQuery, setStatsFiltersQuery] = useState("");

  const isCfa = user?.organisation?.type === ORGANISATION_TYPE.ORGANISME_FORMATION;
  const hasStatsNav = STATS_NAV_ORGANISATION_TYPES.includes(user?.organisation?.type ?? "");
  const { data: unreadData } = useCfaUnreadNotificationsCount(isCfa ? getUserOrganismeId(user) : undefined);
  const unreadCount = unreadData?.count ?? 0;

  const isMl = user?.organisation?.type === ORGANISATION_TYPE.MISSION_LOCALE;
  const { data: compteurs } = useMlCompteursOnglets(isMl && withNav);

  const getMesOrganismesLabel = (type: string) => {
    switch (type) {
      case ORGANISATION_TYPE.ORGANISME_FORMATION:
        return "Mes organismes";
      case ORGANISATION_TYPE.TETE_DE_RESEAU:
        return "Mon réseau";
      case ORGANISATION_TYPE.DREETS:
      case ORGANISATION_TYPE.DDETS:
      case ORGANISATION_TYPE.ACADEMIE:
        return "Mon territoire";
      case ORGANISATION_TYPE.ADMINISTRATEUR:
        return "Tous les organismes";
      default:
        return "Mes organismes";
    }
  };

  const getNavigationItems = () => {
    if (!withNav) return undefined;

    const organisationType = user?.organisation?.type;
    const baseItems: MainNavigationProps["items"] = [];

    if (organisationType === ORGANISATION_TYPE.MISSION_LOCALE) {
      baseItems.push({
        text: <OngletAvecCompteur label="Dossiers prioritaires" compteur={compteurs?.prioritaires} />,
        isActive: pathname === "/mission-locale",
        linkProps: {
          href: "/mission-locale",
          target: "_self",
          onClick: () => trackPlausibleEvent("ml_onglet_prioritaires_ouvert"),
        },
      });
      baseItems.push({
        text: <OngletAvecCompteur label="Collaborations CFA" compteur={compteurs?.collaborations} />,
        isActive: pathname?.startsWith("/mission-locale/collaborations"),
        linkProps: {
          href: "/mission-locale/collaborations",
          target: "_self",
          onClick: () => trackPlausibleEvent("ml_onglet_collaborations_ouvert"),
        },
      });
      baseItems.push({
        text: <OngletAvecCompteur label="Tous les dossiers" compteur={compteurs?.tous} />,
        isActive: pathname?.startsWith("/mission-locale/ruptures"),
        linkProps: {
          href: "/mission-locale/ruptures",
          target: "_self",
          onClick: () => trackPlausibleEvent("ml_onglet_ruptures_ouvert"),
        },
      });
      baseItems.push({
        text: "Inviter des CFA",
        isActive: pathname?.startsWith("/mission-locale/inviter-les-cfa"),
        linkProps: {
          href: "/mission-locale/inviter-les-cfa",
          target: "_self",
          className: styles.inviterCfaLink,
        },
      });
    } else if (organisationType === ORGANISATION_TYPE.ORGANISME_FORMATION) {
      baseItems.push({
        text: "Effectifs de l'établissement",
        isActive: pathname?.startsWith("/cfa/effectifs"),
        linkProps: {
          href: "/cfa/effectifs",
          target: "_self",
          onClick: () => trackPlausibleEvent("cfa_liste_onglet_tous"),
        },
      });
      baseItems.push({
        text: (
          <span className={styles.navLabel}>
            Collaboration et suivi Missions Locales
            {unreadCount > 0 && (
              <span
                className={styles.unreadDot}
                role="status"
                aria-label={`${unreadCount} notification${unreadCount > 1 ? "s" : ""} non lue${unreadCount > 1 ? "s" : ""}`}
              />
            )}
          </span>
        ),
        isActive: pathname?.startsWith("/cfa/collaborations"),
        linkProps: {
          href: "/cfa/collaborations",
          target: "_self",
          onClick: () => trackPlausibleEvent("cfa_liste_onglet_collab"),
        },
      });
      baseItems.push({
        text: (
          <span className={styles.aProposItem}>
            À propos de la nouvelle version
            <i className="fr-icon-information-line fr-icon--sm" aria-hidden="true" />
          </span>
        ),
        isActive: pathname?.startsWith("/cfa/a-propos"),
        linkProps: {
          href: "/cfa/a-propos",
          target: "_self",
          className: styles.aProposLink,
        },
      });
    } else if (
      [
        ORGANISATION_TYPE.TETE_DE_RESEAU,
        ORGANISATION_TYPE.DREETS,
        ORGANISATION_TYPE.DDETS,
        ORGANISATION_TYPE.ARML,
        ORGANISATION_TYPE.ACADEMIE,
        ORGANISATION_TYPE.ADMINISTRATEUR,
      ].includes(organisationType || "")
    ) {
      if (hasStatsNav) {
        STATS_NAV_ITEMS.forEach(({ text, href, isActive }) => {
          baseItems.push({
            text,
            isActive: isActive(pathname ?? ""),
            linkProps: { href: `${href}${statsFiltersQuery}`, target: "_self" },
          });
        });
      }
      if (organisationType === ORGANISATION_TYPE.TETE_DE_RESEAU) {
        baseItems.push({
          text: getMesOrganismesLabel(organisationType || ""),
          linkProps: {
            href: "/organismes",
            target: "_self",
          },
        });
      }
      if (organisationType === ORGANISATION_TYPE.ACADEMIE) {
        baseItems.push({
          text: "Vœux Affelnet",
          linkProps: {
            href: PAGES.static.voeuxAffelnet.getPath(),
            target: "_self",
          },
        });
      }
      if (organisationType === ORGANISATION_TYPE.ADMINISTRATEUR) {
        baseItems.push({
          text: "Admin",
          isActive: !!pathname?.startsWith("/admin") || !!pathname?.startsWith("/organismes"),
          menuLinks: ADMIN_MENU_LINKS.map(({ text, href }) => ({
            text,
            linkProps: { href, target: "_self" },
            isActive: !!pathname?.startsWith(href),
          })),
        });
      }
    } else if (organisationType === ORGANISATION_TYPE.FRANCE_TRAVAIL) {
      baseItems.push({
        text: "Accueil",
        isActive: pathname === "/france-travail",
        linkProps: {
          href: "/france-travail",
          target: "_self",
        },
      });
    }

    const aideMenuLinks: Array<{
      linkProps: {
        href: string;
        target: string;
        rel?: string;
      };
      text: string;
    }> = [];

    const isActeurTerritorial = [ORGANISATION_TYPE.DREETS, ORGANISATION_TYPE.DDETS, ORGANISATION_TYPE.ARML].includes(
      organisationType || ""
    );

    if (!isActeurTerritorial) {
      aideMenuLinks.push({
        linkProps: {
          href: CRISP_FAQ,
          target: "_blank",
          rel: "noopener noreferrer",
        },
        text: "Centre d'aide",
      });
    }

    if (
      !isActeurTerritorial &&
      organisationType !== ORGANISATION_TYPE.MISSION_LOCALE &&
      organisationType !== ORGANISATION_TYPE.FRANCE_TRAVAIL
    ) {
      aideMenuLinks.push({
        linkProps: {
          href: PAGES.static.referencementOrganisme.getPath(),
          target: "_self",
        },
        text: "Référencement de votre organisme",
      });
    }

    aideMenuLinks.push({
      linkProps: {
        href: PAGES.static.glossaire.getPath(),
        target: "_self",
      },
      text: "Glossaire",
    });

    if (!isCfa) {
      baseItems.push({
        text: "Aide et ressources",
        menuLinks: aideMenuLinks,
      });
    }

    return baseItems;
  };

  return (
    <>
      {hasStatsNav && (
        <Suspense fallback={null}>
          <StatsFiltersQueryReader onChange={setStatsFiltersQuery} />
        </Suspense>
      )}
      <DsfrHeader
        brandTop={<>RÉPUBLIQUE FRANÇAISE</>}
        homeLinkProps={{
          href: "/",
          title: `Accueil - ${PRODUCT_NAME_TITLE}`,
        }}
        id="fr-header-simple-header-with-service-title-and-tagline"
        serviceTitle={PRODUCT_NAME_TITLE}
        quickAccessItems={[<Impersonate key="impersonate" />, <UserConnectedHeader key="user-connected" />]}
        navigation={getNavigationItems()}
        disableDisplay
      />
    </>
  );
}
