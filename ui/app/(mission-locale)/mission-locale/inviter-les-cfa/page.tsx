import { Metadata } from "next";

import InviterCfaClient from "./InviterCfaClient";

export const metadata: Metadata = {
  title: "Inviter les CFA | Tableau de bord de l'apprentissage",
};

export default function Page() {
  return <InviterCfaClient />;
}
