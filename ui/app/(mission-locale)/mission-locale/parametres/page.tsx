import { Metadata } from "next";

import { MlContainer } from "../MlContainer";

import ParametresClient from "./ParametresClient";

export const metadata: Metadata = {
  title: "Paramètres | Tableau de bord de l'apprentissage",
};

export default function ParametresPage() {
  return (
    <MlContainer>
      <ParametresClient />
    </MlContainer>
  );
}
