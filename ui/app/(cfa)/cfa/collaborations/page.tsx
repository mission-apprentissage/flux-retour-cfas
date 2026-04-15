import { Metadata } from "next";
import { Suspense } from "react";

import { CfaEffectifsSkeleton } from "@/app/_components/ruptures/cfa/CfaEffectifsSkeleton";

import { CfaContainer } from "../CfaContainer";

import CfaCollaborationsClient from "./CfaCollaborationsClient";

export const metadata: Metadata = {
  title: "Collaborations en cours | Tableau de bord de l'apprentissage",
};

export default function CfaCollaborationsPage() {
  return (
    <CfaContainer>
      <Suspense fallback={<CfaEffectifsSkeleton />}>
        <CfaCollaborationsClient />
      </Suspense>
    </CfaContainer>
  );
}
