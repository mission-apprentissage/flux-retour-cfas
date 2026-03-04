import { Metadata } from "next";
import { Suspense } from "react";

import { CfaEffectifsSkeleton } from "@/app/_components/ruptures/cfa/CfaEffectifsSkeleton";

import CfaEffectifsClient from "./CfaEffectifsClient";

export const metadata: Metadata = {
  title: "Tous mes effectifs | Tableau de bord de l'apprentissage",
};

export default function CfaEffectifsPage() {
  return (
    <Suspense fallback={<CfaEffectifsSkeleton />}>
      <CfaEffectifsClient />
    </Suspense>
  );
}
