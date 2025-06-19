import { Metadata } from "next";

import ConnexionClient from "./ConnexionClient";

export const metadata: Metadata = {
  title: "Connexion | Tableau de bord de l'apprentissage",
};

export default function Page() {
  return <ConnexionClient />;
}
