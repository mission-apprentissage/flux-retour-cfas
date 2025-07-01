import { Metadata } from "next";

import HomeClient from "./HomeClient";

export const metadata: Metadata = {
  title: "Accueil | Tableau de bord de l'apprentissage",
};

export default function Page() {
  return <HomeClient />;
}
