import { Metadata } from "next";

import BienvenueClient from "./BienvenueClient";

export const metadata: Metadata = {
  title: "Bienvenue | Tableau de bord de l'apprentissage",
};

export default function Page() {
  return <BienvenueClient />;
}
