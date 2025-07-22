import { Metadata } from "next";

import CfaClient from "./CfaClient";

export const metadata: Metadata = {
  title: "CFA | Tableau de bord de l'apprentissage",
};

export default function CfaPage() {
  return <CfaClient />;
}
