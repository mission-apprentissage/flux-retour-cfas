import { Metadata } from "next";

import { _get } from "@/common/httpClient";

import MissionLocaleDetailsClient from "./MissionLocaleDetailsClient";

export const metadata: Metadata = {
  title: "Mission Locale | Tableau de bord de l'apprentissage",
};

export default function Page({ params }: { params: Promise<{ mlId: string }> }) {
  return <MissionLocaleDetailsClient params={params} />;
}
