"use client";

import { usePathname } from "next/navigation";

import { SyntheseLabel } from "@/app/_components/statistiques/ui/MenuLabels";

import { StatistiquesLayoutBase } from "./StatistiquesLayoutBase";

const BASE_PATH = "/suivi-des-indicateurs";

export function StatistiquesPublicLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";

  const sideMenuItems = [
    {
      text: <SyntheseLabel isActive={pathname === BASE_PATH} />,
      linkProps: { href: BASE_PATH },
      isActive: pathname === BASE_PATH,
    },
  ];

  return <StatistiquesLayoutBase sideMenuItems={sideMenuItems}>{children}</StatistiquesLayoutBase>;
}
