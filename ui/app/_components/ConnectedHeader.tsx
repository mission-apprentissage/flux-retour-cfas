"use client";

import { Header as DsfrHeader } from "@codegouvfr/react-dsfr/Header";
import { CRISP_FAQ } from "shared";

import { Impersonate } from "./Impersonate";
import { UserConnectedHeader } from "./UserConnectedHeader";

export function ConnectedHeader() {
  return (
    <DsfrHeader
      brandTop={<>RÉPUBLIQUE FRANÇAISE</>}
      homeLinkProps={{
        href: "/",
        title: "Accueil - Nom de l’entité (ministère, secrétariat d‘état, gouvernement)",
      }}
      id="fr-header-simple-header-with-service-title-and-tagline"
      serviceTitle={<>Tableau de bord de l&apos;apprentissage</>}
      quickAccessItems={[<Impersonate key="impersonate" />, <UserConnectedHeader key="user-connected" />]}
      navigation={[
        {
          text: "Mon tableau de bord",
          isActive: true,
          linkProps: {
            href: "/mission-locale",
            target: "_self",
          },
        },
        {
          text: "Aide et ressources",
          menuLinks: [
            {
              linkProps: {
                href: CRISP_FAQ,
                target: "_blank",
                rel: "noopener noreferrer",
              },

              text: "Centre d’aide",
            },
          ],
        },
      ]}
    />
  );
}
