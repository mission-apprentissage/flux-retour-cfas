import { Metadata } from "next";

import { MlContainer } from "../MlContainer";

import ValidationClient from "./ValidationClient";

export const metadata: Metadata = {
  title: "Traitement | Tableau de bord de l'apprentissage",
};

export default function Page() {
  return (
    <MlContainer>
      <ValidationClient />
    </MlContainer>
  );
}
