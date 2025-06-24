import { CRISP_FAQ } from "shared";

import { ConnectedHeader } from "../ConnectedHeader";

export function ConnectedHeaderML() {
  const navigation = [
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
  ];
  return <ConnectedHeader navigation={navigation}></ConnectedHeader>;
}
