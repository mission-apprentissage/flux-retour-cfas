import { Metadata } from "next";

import { CfaAProposClient } from "@/app/_components/ruptures/cfa/a-propos/CfaAProposClient";

export const metadata: Metadata = {
  title: "À propos de la nouvelle version | Tableau de bord de l'apprentissage",
};

export default function CfaAProposPage() {
  return <CfaAProposClient />;
}
