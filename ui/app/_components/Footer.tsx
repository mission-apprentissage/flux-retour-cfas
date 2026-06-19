"use client";

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
        <>
          <img
            src="/images/numerique_gouv.png"
            alt="Un service proposé par numerique.gouv"
            className="footer-operator-logo"
          />
          Mandatée par le Ministère du Travail, de l&apos;Emploi et de l&apos;Insertion, le Ministère de la
          Transformation et de la Fonction publiques, le Ministère de l&apos;Éducation Nationale, de la Jeunesse et des
          Sports, le Ministère de la Recherche, de l&apos;Enseignement Supérieur et de l&apos;Innovation, la Mission
          interministérielle pour l&apos;apprentissage développe plusieurs services destinés à faciliter les entrées en
          apprentissage.
        </>
      }
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
