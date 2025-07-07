import { Metadata } from "next";

import MissionLocaleAdminClient from "./MissionLocaleAdminClient";

export const metadata: Metadata = {
  title: "Missions Locales | Tableau de bord de l'apprentissage",
};

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return <MissionLocaleAdminClient params={params} />;
}
