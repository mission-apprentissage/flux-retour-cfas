import { Metadata } from "next";

import AccueilTerritoirePageClient from "./page.client";

export const metadata: Metadata = {
  title: "Territoire | Tableau de bord de l'apprentissage",
};

export default function AccueilTerritoirePage() {
  return <AccueilTerritoirePageClient />;
}
