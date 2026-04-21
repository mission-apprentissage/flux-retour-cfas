import { Metadata } from "next";

import { CfaContainer } from "../CfaContainer";

import RolesHabilitationsClient from "./RolesHabilitationsClient";

export const metadata: Metadata = {
  title: "Rôles et habilitations | Tableau de bord de l'apprentissage",
};

export default function RolesHabilitationsPage() {
  return (
    <CfaContainer>
      <RolesHabilitationsClient />
    </CfaContainer>
  );
}
