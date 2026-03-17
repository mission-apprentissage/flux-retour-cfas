import { Metadata } from "next";

import { CfaContainer } from "../CfaContainer";

import ParametresClient from "./ParametresClient";

export const metadata: Metadata = {
  title: "Paramétrage de votre moyen de transmission | Tableau de bord de l'apprentissage",
};

export default function ParametresPage() {
  return (
    <CfaContainer>
      <ParametresClient />
    </CfaContainer>
  );
}
