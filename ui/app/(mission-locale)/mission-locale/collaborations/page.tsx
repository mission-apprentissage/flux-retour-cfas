import { Metadata } from "next";

import { MlContainer } from "../MlContainer";

import MlCollaborationsClient from "./MlCollaborationsClient";

export const metadata: Metadata = {
  title: "Collaborations CFA | Tableau de bord de l'apprentissage",
};

export default function Page() {
  return (
    <MlContainer>
      <MlCollaborationsClient />
    </MlContainer>
  );
}
