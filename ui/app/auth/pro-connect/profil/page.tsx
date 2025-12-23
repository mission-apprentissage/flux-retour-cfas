import { Metadata } from "next";

import ProConnectProfilClient from "./ProConnectProfilClient";

export const metadata: Metadata = {
  title: "Profil ProConnect | Tableau de bord de l'apprentissage",
};

export default function CfaPage() {
  return <ProConnectProfilClient />;
}
