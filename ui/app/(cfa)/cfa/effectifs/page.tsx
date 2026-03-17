import { Metadata } from "next";
import { Suspense } from "react";

import { CfaEffectifsSkeleton } from "@/app/_components/ruptures/cfa/CfaEffectifsSkeleton";

import { CfaContainer } from "../CfaContainer";

import CfaEffectifsClient from "./CfaEffectifsClient";

export const metadata: Metadata = {
  title: "Tous mes effectifs | Tableau de bord de l'apprentissage",
};

export default function CfaEffectifsPage() {
  return (
    <CfaContainer>
      <Suspense fallback={<CfaEffectifsSkeleton />}>
        <CfaEffectifsClient />
      </Suspense>
    </CfaContainer>
  );
}
