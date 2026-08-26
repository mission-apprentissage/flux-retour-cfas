import { Metadata } from "next";

import { MlContainer } from "../MlContainer";

import MlRupturesClient from "./MlRupturesClient";

export const metadata: Metadata = {
  title: "Liste ruptures | Tableau de bord de l'apprentissage",
};

export default function Page() {
  return (
    <MlContainer>
      <MlRupturesClient />
    </MlContainer>
  );
}
