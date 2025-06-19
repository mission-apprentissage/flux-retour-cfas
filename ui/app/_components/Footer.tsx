import { Footer as DsfrFooter } from "@codegouvfr/react-dsfr/Footer";
import { CRISP_FAQ } from "shared";

export function Footer() {
  return (
    <DsfrFooter
      accessibility="non compliant"
      brandTop={<>RÉPUBLIQUE FRANÇAISE</>}
      homeLinkProps={{
        href: "/",
        title: "Accueil - Nom de l'entité (ministère, secrétariat d'état, gouvernement)",
      }}
      contentDescription={
        <>Cette plateforme est proposée par le Ministère du Travail, de la Santé, des Solidarités et des Familles.</>
      }
      operatorLogo={{
        alt: "France relance",
        imgUrl: "/images/france_relance.svg",
        orientation: "vertical",
      }}
      bottomItems={[
        {
          text: "Plan du site",
          linkProps: { href: "/sitemap.xml" },
        },
        {
          text: "Accessibilité : non conforme",
          linkProps: { href: "/accessibilite" },
        },
        {
          text: "Mentions légales",
          linkProps: { href: "/mentions-legales" },
        },
        {
          text: "Conditions générales d’utilisation",
          linkProps: { href: "/cgu" },
        },
        {
          text: "Statistiques",
          linkProps: { href: "/stats" },
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
          text: "Politique de confidentialité",
          linkProps: { href: "/politique-de-confidentialite" },
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
          text: "Journal des évolutions",
          linkProps: {
            href: "https://www.notion.so/mission-apprentissage/Journal-des-volutions-5c9bec4ae3c3451da671f3f684ee994f",
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
