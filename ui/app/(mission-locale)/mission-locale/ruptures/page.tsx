import { Metadata } from "next";

import { MlContainer } from "../MlContainer";

import MlRupturesClient from "./MlRupturesClient";

export const metadata: Metadata = {
  title: "Tous les dossiers | Tableau de bord de l'apprentissage",
};

export default function Page() {
  return (
    <MlContainer>
      <MlRupturesClient />
    </MlContainer>
  );
}
