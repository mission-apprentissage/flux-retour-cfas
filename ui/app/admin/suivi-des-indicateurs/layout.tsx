import type { Metadata } from "next";

import { StatistiquesLayoutClient } from "./StatistiquesLayoutClient";

export const metadata: Metadata = {
  title: "Suivi des indicateurs | Tableau de bord de l'apprentissage",
};

export default async function StatistiquesLayout({ children }: { children: JSX.Element }) {
  return <StatistiquesLayoutClient>{children}</StatistiquesLayoutClient>;
}
