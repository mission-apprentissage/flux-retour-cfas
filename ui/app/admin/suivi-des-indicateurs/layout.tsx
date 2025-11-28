import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ORGANISATION_TYPE } from "shared";

import { getSession } from "@/app/_utils/session.utils";

import { StatistiquesLayoutClient } from "./StatistiquesLayoutClient";

export const metadata: Metadata = {
  title: "Suivi des indicateurs | Tableau de bord de l'apprentissage",
};

export default async function StatistiquesLayout({ children }: { children: JSX.Element }) {
  const user = await getSession();

  if (user?.organisation?.type !== ORGANISATION_TYPE.ADMINISTRATEUR) {
    redirect("/auth/connexion");
  }

  return <StatistiquesLayoutClient>{children}</StatistiquesLayoutClient>;
}
