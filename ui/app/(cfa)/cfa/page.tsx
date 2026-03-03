import { Metadata } from "next";
import { Suspense } from "react";

import { CfaDashboardSkeleton } from "@/app/_components/ruptures/cfa/CfaDashboardSkeleton";

import CfaClient from "./CfaClient";

export const metadata: Metadata = {
  title: "CFA | Tableau de bord de l'apprentissage",
};

export default function CfaPage() {
  return (
    <Suspense fallback={<CfaDashboardSkeleton />}>
      <CfaClient />
    </Suspense>
  );
}
