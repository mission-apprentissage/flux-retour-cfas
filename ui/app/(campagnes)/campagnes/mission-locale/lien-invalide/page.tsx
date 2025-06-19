import { Metadata } from "next";

import LienInvalideClient from "./LienInvalideClient";

export const metadata: Metadata = {
  title: "Lien invalide | Tableau de bord de l'apprentissage",
};

export default function Page() {
  return <LienInvalideClient />;
}
