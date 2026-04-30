"use client";

import { Header as DsfrHeader } from "@codegouvfr/react-dsfr/Header";
import { usePathname } from "next/navigation";
import { CRISP_FAQ } from "shared";

const ROUTES = {
  ACCUEIL: "/",
  ACCUEIL_CFA: "/accueil-cfa",
  ACCUEIL_MISSION_LOCALE: "/accueil-mission-locale",
  ACCUEIL_TERRITOIRE: "/accueil-territoire",
  CENTRE_AIDE: CRISP_FAQ,
};

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname?.startsWith(href);
}

export function PublicHeader() {
  const pathname = usePathname() ?? "/";
  return (
    <DsfrHeader
      brandTop={<>RÉPUBLIQUE FRANÇAISE</>}
      homeLinkProps={{
        href: "/",
        title: "Accueil - Tableau de bord de l'apprentissage",
      }}
      id="fr-header-simple-header-with-service-title-and-tagline"
      serviceTitle={<>Tableau de bord de l&apos;apprentissage</>}
      quickAccessItems={[
        {
          iconId: "fr-icon-add-circle-line",
          linkProps: {
            href: "/auth/inscription",
            target: "_self",
          },
          text: "S'inscrire",
        },
        {
          linkProps: {
            href: "/auth/connexion",
            target: "_self",
          },
          iconId: "ri-account-box-line",
          text: "Se connecter",
        },
      ]}
      navigation={[
        {
          text: "Accueil",
          isActive: isActive(pathname, "/"),
          linkProps: {
            href: "/",
            target: "_self",
          },
        },
        {
          text: "Établissement de formation (CFA)",
          isActive: isActive(pathname, ROUTES.ACCUEIL_CFA),
          linkProps: {
            href: ROUTES.ACCUEIL_CFA,
            target: "_self",
          },
        },
        {
          text: "Missions Locales",
          isActive: isActive(pathname, ROUTES.ACCUEIL_MISSION_LOCALE),
          linkProps: {
            href: ROUTES.ACCUEIL_MISSION_LOCALE,
            target: "_self",
          },
        },
        {
          text: "Collectivités et acteurs de l'apprentissage",
          isActive: isActive(pathname, ROUTES.ACCUEIL_TERRITOIRE),
          linkProps: {
            href: ROUTES.ACCUEIL_TERRITOIRE,
            target: "_self",
          },
        },
        {
          text: "Centre d'aide",
          isActive: isActive(pathname, ROUTES.CENTRE_AIDE),
          linkProps: {
            href: ROUTES.CENTRE_AIDE,
            target: "_blank",
            rel: "noopener noreferrer",
          },
        },
      ]}
    />
  );
}
