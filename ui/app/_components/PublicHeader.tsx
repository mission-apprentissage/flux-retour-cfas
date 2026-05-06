"use client";

import { Header as DsfrHeader } from "@codegouvfr/react-dsfr/Header";
import { usePathname } from "next/navigation";
import { CRISP_FAQ } from "shared";

import { PAGES } from "@/app/_utils/routes.utils";

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname?.startsWith(href);
}

export function PublicHeader() {
  const pathname = usePathname() ?? "/";
  const home = PAGES.static.home;
  const accueilCfa = PAGES.static.accueilCfa;
  const accueilMissionLocale = PAGES.static.accueilMissionLocale;
  const accueilTerritoire = PAGES.static.accueilTerritoire;
  return (
    <DsfrHeader
      brandTop={<>RÉPUBLIQUE FRANÇAISE</>}
      homeLinkProps={{
        href: home.getPath(),
        title: "Accueil - Tableau de bord de l'apprentissage",
      }}
      id="fr-header-simple-header-with-service-title-and-tagline"
      serviceTitle={<>Tableau de bord de l&apos;apprentissage</>}
      quickAccessItems={[
        {
          iconId: "fr-icon-add-circle-line",
          linkProps: {
            href: PAGES.dynamic.authInscription().getPath(),
            target: "_self",
          },
          text: "S'inscrire",
        },
        {
          linkProps: {
            href: PAGES.static.authConnexion.getPath(),
            target: "_self",
          },
          iconId: "ri-account-box-line",
          text: "Se connecter",
        },
      ]}
      navigation={[
        {
          text: home.title,
          isActive: isActive(pathname, home.getPath()),
          linkProps: {
            href: home.getPath(),
            target: "_self",
          },
        },
        {
          text: accueilCfa.title,
          isActive: isActive(pathname, accueilCfa.getPath()),
          linkProps: {
            href: accueilCfa.getPath(),
            target: "_self",
          },
        },
        {
          text: accueilMissionLocale.title,
          isActive: isActive(pathname, accueilMissionLocale.getPath()),
          linkProps: {
            href: accueilMissionLocale.getPath(),
            target: "_self",
          },
        },
        {
          text: accueilTerritoire.title,
          isActive: isActive(pathname, accueilTerritoire.getPath()),
          linkProps: {
            href: accueilTerritoire.getPath(),
            target: "_self",
          },
        },
        {
          text: "Centre d'aide",
          isActive: isActive(pathname, CRISP_FAQ),
          linkProps: {
            href: CRISP_FAQ,
            target: "_blank",
            rel: "noopener noreferrer",
          },
        },
      ]}
    />
  );
}
