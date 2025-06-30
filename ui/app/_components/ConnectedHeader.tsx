"use client";

import { Header as DsfrHeader } from "@codegouvfr/react-dsfr/Header";
import { usePathname } from "next/navigation";
import { CRISP_FAQ, ORGANISATION_TYPE } from "shared";

import { useAuth } from "../_context/UserContext";

import { Impersonate } from "./Impersonate";
import { UserConnectedHeader } from "./UserConnectedHeader";

export function ConnectedHeader() {
  const { user } = useAuth();
  const pathname = usePathname();

  const getMesOrganismesLabel = (type: string) => {
    switch (type) {
      case ORGANISATION_TYPE.ORGANISME_FORMATION:
        return "Mes organismes";
      case ORGANISATION_TYPE.TETE_DE_RESEAU:
        return "Mon réseau";
      case ORGANISATION_TYPE.DREETS:
      case ORGANISATION_TYPE.DRAAF:
      case ORGANISATION_TYPE.CONSEIL_REGIONAL:
      case ORGANISATION_TYPE.CARIF_OREF_REGIONAL:
      case ORGANISATION_TYPE.DRAFPIC:
      case ORGANISATION_TYPE.DDETS:
      case ORGANISATION_TYPE.ACADEMIE:
        return "Mon territoire";
      case ORGANISATION_TYPE.OPERATEUR_PUBLIC_NATIONAL:
      case ORGANISATION_TYPE.CARIF_OREF_NATIONAL:
      case ORGANISATION_TYPE.ADMINISTRATEUR:
        return "Tous les organismes";
      default:
        return "Mes organismes";
    }
  };

  const getNavigationItems = () => {
    const organisationType = user?.organisation?.type;
    const baseItems: any[] = [];

    if (organisationType === ORGANISATION_TYPE.MISSION_LOCALE) {
      baseItems.push({
        text: "Mon tableau de bord",
        linkProps: {
          href: "/mission-locale",
          target: "_self",
        },
      });
    } else if (organisationType === ORGANISATION_TYPE.ORGANISME_FORMATION) {
      baseItems.push({
        text: "Mon tableau de bord",
        linkProps: {
          href: "/",
          target: "_self",
        },
      });
      baseItems.push({
        text: "Mes organismes",
        linkProps: {
          href: "/organismes",
          target: "_self",
        },
      });
      baseItems.push({
        text: "Mes indicateurs",
        linkProps: {
          href: "/indicateurs",
          target: "_self",
        },
      });
      baseItems.push({
        text: "Mes effectifs",
        linkProps: {
          href: "/effectifs",
          target: "_self",
        },
      });
      baseItems.push({
        text: "Mon enquête SIFA",
        linkProps: {
          href: "/enquete-sifa",
          target: "_self",
        },
      });
      baseItems.push({
        text: "Indicateurs Nationaux",
        linkProps: {
          href: "/national/indicateurs",
          target: "_self",
        },
      });
    } else if (
      [
        ORGANISATION_TYPE.TETE_DE_RESEAU,
        ORGANISATION_TYPE.DREETS,
        ORGANISATION_TYPE.DRAAF,
        ORGANISATION_TYPE.CONSEIL_REGIONAL,
        ORGANISATION_TYPE.CARIF_OREF_REGIONAL,
        ORGANISATION_TYPE.DRAFPIC,
        ORGANISATION_TYPE.DDETS,
        ORGANISATION_TYPE.ACADEMIE,
        ORGANISATION_TYPE.OPERATEUR_PUBLIC_NATIONAL,
        ORGANISATION_TYPE.CARIF_OREF_NATIONAL,
        ORGANISATION_TYPE.ADMINISTRATEUR,
      ].includes(organisationType || "")
    ) {
      baseItems.push({
        text: "Mon tableau de bord",
        linkProps: {
          href: "/home",
          target: "_self",
        },
      });
      baseItems.push({
        text: getMesOrganismesLabel(organisationType || ""),
        linkProps: {
          href: "/organismes",
          target: "_self",
        },
      });
      baseItems.push({
        text: "Mes indicateurs",
        linkProps: {
          href: "/indicateurs",
          target: "_self",
        },
      });
      if (
        [ORGANISATION_TYPE.DREETS, ORGANISATION_TYPE.DRAFPIC, ORGANISATION_TYPE.ACADEMIE].includes(
          organisationType || ""
        )
      ) {
        baseItems.push({
          text: "Vœux Affelnet",
          linkProps: {
            href: "/voeux-affelnet",
            target: "_self",
          },
        });
      }
      baseItems.push({
        text: "Indicateurs Nationaux",
        linkProps: {
          href: "/national/indicateurs",
          target: "_self",
        },
      });
    } else if (organisationType === ORGANISATION_TYPE.ARML) {
      baseItems.push({
        text: "Accueil",
        // isActive: pathname === "/arml",
        linkProps: {
          href: "/arml",
          target: "_self",
        },
      });
      baseItems.push({
        text: "Missions Locales",
        isActive: pathname?.startsWith("/arml/missions-locales"),
        linkProps: {
          href: "/arml/missions-locales",
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

    if ([ORGANISATION_TYPE.DREETS, ORGANISATION_TYPE.DDETS].includes(organisationType || "")) {
      aideMenuLinks.push({
        linkProps: {
          href: "https://cfas.apprentissage.beta.gouv.fr/docs/kit-deploiement-tba-op",
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

    if (organisationType !== ORGANISATION_TYPE.MISSION_LOCALE && organisationType !== ORGANISATION_TYPE.ARML) {
      aideMenuLinks.push({
        linkProps: {
          href: "/referencement-organisme",
          target: "_self",
        },
        text: "Référencement de votre organisme",
      });
    }

    aideMenuLinks.push({
      linkProps: {
        href: "/glossaire",
        target: "_self",
      },
      text: "Glossaire",
    });

    baseItems.push({
      text: "Aide et ressources",
      menuLinks: aideMenuLinks,
    });

    if (organisationType === ORGANISATION_TYPE.ORGANISME_FORMATION) {
      baseItems.push({
        text: "Paramètres",
        linkProps: {
          href: "/parametres",
          target: "_self",
        },
      });
    }

    return baseItems;
  };

  return (
    <DsfrHeader
      brandTop={<>RÉPUBLIQUE FRANÇAISE</>}
      homeLinkProps={{
        href: "/",
        title: "Accueil - Nom de l'entité (ministère, secrétariat d'état, gouvernement)",
      }}
      id="fr-header-simple-header-with-service-title-and-tagline"
      serviceTitle={<>Tableau de bord de l&apos;apprentissage</>}
      quickAccessItems={[<Impersonate key="impersonate" />, <UserConnectedHeader key="user-connected" />]}
      navigation={getNavigationItems()}
    />
  );
}
