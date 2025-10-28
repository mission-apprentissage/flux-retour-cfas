import { Metadata } from "next";

import DejaTraitesClient from "./DejaTraitesClient";

export const metadata: Metadata = {
  title: "Dossiers traités | Tableau de bord de l'apprentissage",
};

export default function DejaTraitesPage() {
  return <DejaTraitesClient />;
}
