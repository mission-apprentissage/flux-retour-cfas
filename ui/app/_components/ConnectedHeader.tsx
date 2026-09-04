"use client";

import { Header as DsfrHeader } from "@codegouvfr/react-dsfr/Header";
import { usePathname } from "next/navigation";
import { CRISP_FAQ, ORGANISATION_TYPE } from "shared";

import { PAGES } from "@/app/_utils/routes.utils";
import { PRODUCT_NAME_TITLE } from "@/common/constants/product";

import { useAuth } from "../_context/UserContext";
import { usePlausibleAppTracking } from "../_hooks/plausible";

import styles from "./ConnectedHeader.module.css";
import { Impersonate } from "./Impersonate";
import { useCfaUnreadNotificationsCount } from "./ruptures/cfa/hooks";
import { UserConnectedHeader } from "./UserConnectedHeader";

export function ConnectedHeader({ withNav = true }: { withNav?: boolean }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const { trackPlausibleEvent } = usePlausibleAppTracking();

  const isCfa = user?.organisation?.type === ORGANISATION_TYPE.ORGANISME_FORMATION;
  const { data: unreadData } = useCfaUnreadNotificationsCount(isCfa ? user?.organisation?.organisme_id : undefined);
  const unreadCount = unreadData?.count ?? 0;

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
    const baseItems: any[] = [];

    if (organisationType === ORGANISATION_TYPE.MISSION_LOCALE) {
      baseItems.push({
        text: "Dossiers prioritaires",
        isActive: pathname === "/mission-locale",
        linkProps: {
          href: "/mission-locale",
          target: "_self",
          onClick: () => trackPlausibleEvent("ml_onglet_prioritaires_ouvert"),
        },
      });
      baseItems.push({
        text: "Collaborations CFA",
        isActive: pathname?.startsWith("/mission-locale/collaborations"),
        linkProps: {
          href: "/mission-locale/collaborations",
          target: "_self",
          onClick: () => trackPlausibleEvent("ml_onglet_collaborations_ouvert"),
        },
      });
      baseItems.push({
        text: "Tous les dossiers",
        isActive: pathname?.startsWith("/mission-locale/ruptures"),
        linkProps: {
          href: "/mission-locale/ruptures",
          target: "_self",
          onClick: () => trackPlausibleEvent("ml_onglet_ruptures_ouvert"),
        },
      });
      baseItems.push({
        text: "Inviter les CFA",
        isActive: pathname?.startsWith("/mission-locale/inviter-les-cfa"),
        linkProps: {
          href: "/mission-locale/inviter-les-cfa",
          target: "_self",
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
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
            Collaboration et suivi Missions Locales
            {unreadCount > 0 && (
              <span
                style={{
                  display: "inline-block",
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: "var(--text-default-error)",
                  flexShrink: 0,
                }}
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
        ORGANISATION_TYPE.ACADEMIE,
        ORGANISATION_TYPE.ADMINISTRATEUR,
      ].includes(organisationType || "")
    ) {
      if (organisationType === ORGANISATION_TYPE.ADMINISTRATEUR) {
        baseItems.push({
          text: "Suivi des indicateurs",
          isActive: pathname?.startsWith("/admin/suivi-des-indicateurs"),
          linkProps: {
            href: "/admin/suivi-des-indicateurs",
            target: "_self",
          },
        });
      }
      if (organisationType === ORGANISATION_TYPE.DREETS || organisationType === ORGANISATION_TYPE.DDETS) {
        baseItems.push({
          text: "Suivi des indicateurs",
          isActive: pathname?.startsWith("/suivi-des-indicateurs"),
          linkProps: {
            href: "/suivi-des-indicateurs",
            target: "_self",
          },
        });
      }
      if (
        organisationType === ORGANISATION_TYPE.TETE_DE_RESEAU ||
        organisationType === ORGANISATION_TYPE.ADMINISTRATEUR
      ) {
        baseItems.push({
          text: getMesOrganismesLabel(organisationType || ""),
          linkProps: {
            href: "/organismes",
            target: "_self",
          },
        });
      }
      if (organisationType === ORGANISATION_TYPE.DREETS || organisationType === ORGANISATION_TYPE.ACADEMIE) {
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
          text: "Gestion des utilisateurs",
          isActive: pathname?.startsWith("/admin/users"),
          linkProps: {
            href: "/admin/users",
            target: "_self",
          },
        });
        baseItems.push({
          text: "Impostures",
          isActive: pathname?.startsWith("/admin/impostures"),
          linkProps: {
            href: "/admin/impostures",
            target: "_self",
          },
        });
        baseItems.push({
          text: "Administration",
          isActive:
            !!pathname?.startsWith("/admin") &&
            !pathname?.startsWith("/admin/suivi-des-indicateurs") &&
            !pathname?.startsWith("/admin/users") &&
            !pathname?.startsWith("/admin/impostures"),
          menuLinks: [
            { text: "Gestion des réseaux", linkProps: { href: "/admin/reseaux", target: "_self" } },
            { text: "Toutes les transmissions", linkProps: { href: "/admin/transmissions", target: "_self" } },
            { text: "Recherche d'un organisme", linkProps: { href: "/admin/organismes/recherche", target: "_self" } },
            { text: "Fusion d'organismes", linkProps: { href: "/admin/fusion-organismes", target: "_self" } },
            {
              text: "Organismes absents du référentiel",
              linkProps: { href: "/admin/organismes/gestion", target: "_self" },
            },
            { text: "Listes de contacts Brevo", linkProps: { href: "/admin/brevo-contacts", target: "_self" } },
          ],
        });
      }
    } else if (organisationType === ORGANISATION_TYPE.ARML) {
      baseItems.push({
        text: "Suivi des indicateurs",
        isActive: pathname?.startsWith("/suivi-des-indicateurs"),
        linkProps: {
          href: "/suivi-des-indicateurs",
          target: "_self",
        },
      });
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

    if (organisationType === ORGANISATION_TYPE.DREETS || organisationType === ORGANISATION_TYPE.DDETS) {
      aideMenuLinks.push({
        linkProps: {
          href: PAGES.static.docsKitDeploiementTbaOp.getPath(),
          target: "_blank",
          rel: "noopener noreferrer",
        },
        text: "Kit de déploiement DREETS/DDETS",
      });
    }

    aideMenuLinks.push({
      linkProps: {
        href: CRISP_FAQ,
        target: "_blank",
        rel: "noopener noreferrer",
      },
      text: "Centre d'aide",
    });

    if (
      organisationType !== ORGANISATION_TYPE.MISSION_LOCALE &&
      organisationType !== ORGANISATION_TYPE.ARML &&
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
  );
}
