import type { Metadata } from "next";

import { Footer } from "../_components/Footer";
import { PublicHeaderWithoutAuth } from "../_components/PublicHeaderWithoutAuth";
import { Providers } from "../providers";

import { StatistiquesLayoutClient } from "./StatistiquesLayoutClient";

export const metadata: Metadata = {
  title: "Suivi des indicateurs | Tableau de bord de l'apprentissage",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default async function StatistiquesLayout({ children }: { children: JSX.Element }) {
  return (
    <Providers>
      <PublicHeaderWithoutAuth />
      <StatistiquesLayoutClient>{children}</StatistiquesLayoutClient>
      <Footer />
    </Providers>
  );
}
