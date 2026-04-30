import { Metadata } from "next";

import HomePageClient from "./page.client";

export const metadata: Metadata = {
  title: "Accueil | Tableau de bord de l'apprentissage",
};

export default function HomePage() {
  return <HomePageClient />;
}
