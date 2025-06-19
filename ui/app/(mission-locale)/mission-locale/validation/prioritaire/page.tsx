import { Metadata } from "next";

import ValidationPrioritaireClient from "./ValidationPrioritaireClient";

export const metadata: Metadata = {
  title: "Traitement Prioritaires | Tableau de bord de l'apprentissage",
};

export default function Page() {
  return <ValidationPrioritaireClient />;
}
