import { CRISP_FAQ } from "shared";

import { ConnectedHeader } from "../ConnectedHeader";

export function ConnectedHeaderARML() {
  const navigation = [
    {
      text: "Missions Locales",
      isActive: true,
      linkProps: {
        href: "/arml",
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
