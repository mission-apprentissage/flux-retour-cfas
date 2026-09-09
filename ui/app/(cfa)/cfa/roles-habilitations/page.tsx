import { Metadata } from "next";

import RolesHabilitationsClient from "@/app/_components/roles-habilitations/RolesHabilitationsClient";

import { CfaContainer } from "../CfaContainer";

export const metadata: Metadata = {
  title: "Rôles et habilitations | Tableau de bord de l'apprentissage",
};

export default function RolesHabilitationsPage() {
  return (
    <CfaContainer>
      <RolesHabilitationsClient requireCfaAdmin />
    </CfaContainer>
  );
}
