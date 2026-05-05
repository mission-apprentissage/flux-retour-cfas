import { Metadata } from "next";

import AccueilMissionLocalePageClient from "./page.client";

export const metadata: Metadata = {
  title: "Accueil mission locale | Tableau de bord de l'apprentissage",
};

export default function AccueilMissionLocalePage() {
  return <AccueilMissionLocalePageClient />;
}
