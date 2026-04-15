import { Metadata } from "next";

import { MlContainer } from "../../MlContainer";

import ValidationPrioritaireClient from "./ValidationPrioritaireClient";

export const metadata: Metadata = {
  title: "Traitement Prioritaires | Tableau de bord de l'apprentissage",
};

export default function Page() {
  return (
    <MlContainer>
      <ValidationPrioritaireClient />
    </MlContainer>
  );
}
