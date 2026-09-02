"use client";

import { Footer as DsfrFooter } from "@codegouvfr/react-dsfr/Footer";
import { CRISP_FAQ } from "shared";

import { PAGES } from "@/app/_utils/routes.utils";
import { PRODUCT_NAME_TITLE } from "@/common/constants/product";

export function Footer() {
  return (
    <DsfrFooter
      accessibility="non compliant"
      accessibilityLinkProps={{ href: PAGES.static.accessibilite.getPath() }}
      brandTop={<>RÉPUBLIQUE FRANÇAISE</>}
      homeLinkProps={{
        href: "/",
        title: `Accueil - ${PRODUCT_NAME_TITLE}`,
      }}
      contentDescription={
        <>
          <img
            src="/images/numerique_gouv.png"
            alt="Un service proposé par numerique.gouv"
            className="footer-operator-logo"
          />
          Le Tableau de bord est la plateforme qui outille la collaboration entre les acteurs de l&apos;apprentissage et
          le service public à l&apos;emploi. Le Tableau de bord participe à la prévention de rupture et à la lutte
          contre le décrochage après une rupture de contrat d&apos;apprentissage en permettant à chaque jeune de
          bénéficier d&apos;un accompagnement du service public dans les moments clés de son parcours.
        </>
      }
      bottomItems={[
        {
          text: "Plan du site",
          linkProps: { href: "/sitemap.xml" },
        },
        {
          text: "Mentions légales",
          linkProps: { href: PAGES.static.mentionsLegales.getPath() },
        },
        {
          text: "CGU",
          linkProps: { href: PAGES.static.cgu.getPath() },
        },
        {
          text: "Centre d’aide",
          linkProps: {
            href: CRISP_FAQ,
            target: "_blank",
            rel: "noopener noreferrer",
          },
        },
        {
          text: "Données personnelles",
          linkProps: { href: PAGES.static.politiqueConfidentialite.getPath() },
        },
        {
          text: "À propos",
          linkProps: {
            href: "https://beta.gouv.fr/startups/tdb-apprentissage.html",
            target: "_blank",
            rel: "noopener noreferrer",
          },
        },
        {
          text: "Code source",
          linkProps: {
            href: "https://github.com/mission-apprentissage/flux-retour-cfas",
            target: "_blank",
            rel: "noopener noreferrer",
          },
        },
      ]}
    />
  );
}
