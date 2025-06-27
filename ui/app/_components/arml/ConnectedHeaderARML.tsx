"use client";
import { usePathname } from "next/navigation";
import { CRISP_FAQ } from "shared";

import { ConnectedHeader } from "../ConnectedHeader";

export function ConnectedHeaderARML() {
  const pathname = usePathname();
  const navigation = [
    {
      text: "Accueil",
      isActive: pathname === "/arml",
      linkProps: {
        href: "/arml",
        target: "_self",
      },
    },
    {
      text: "Missions Locales",
      isActive: pathname?.startsWith("/arml/missions-locales"),
      linkProps: {
        href: "/arml/missions-locales",
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
