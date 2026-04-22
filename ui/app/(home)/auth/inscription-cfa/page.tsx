import { Metadata } from "next";

import InscriptionCfaClient from "./InscriptionCfaClient";

export const metadata: Metadata = {
  title: "Création de compte CFA | Tableau de bord de l'apprentissage",
};

export default function Page() {
  return <InscriptionCfaClient />;
}
