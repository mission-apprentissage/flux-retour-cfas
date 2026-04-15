import { Metadata } from "next";

import MissionLocaleDetailClient from "./MissionLocaleDetailClient";

export const metadata: Metadata = {
  title: `Mission Locale | Tableau de bord de l'apprentissage`,
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MissionLocaleDetailClient id={id} />;
}
