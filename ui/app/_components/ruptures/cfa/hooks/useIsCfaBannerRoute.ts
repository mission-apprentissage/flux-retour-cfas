"use client";

import { usePathname } from "next/navigation";

const CFA_TABS_WITH_BANNER = ["/cfa/collaborations", "/cfa/effectifs"] as const;

export function useIsCfaBannerRoute() {
  const pathname = usePathname();

  return (
    pathname === "/cfa" || CFA_TABS_WITH_BANNER.some((route) => pathname === route || pathname?.startsWith(`${route}/`))
  );
}
