import { Metadata } from "next";

import AccueilCfaPageClient from "./page.client";

export const metadata: Metadata = {
  title: "Accueil CFA | Tableau de bord de l'apprentissage",
};

export default function AccueilCfaPage() {
  return <AccueilCfaPageClient />;
}
