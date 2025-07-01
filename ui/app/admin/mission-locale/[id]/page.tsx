import { Metadata } from "next";

import MissionLocaleClient from "./MissionLocaleClient";

export const metadata: Metadata = {
  title: `Mission Locale | Tableau de bord de l'apprentissage`,
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MissionLocaleClient id={id} />;
}
