import { Metadata } from "next";

import { _get } from "@/common/httpClient";

import MissionLocaleEffectifClient from "./MissionLocaleEffectifClient";

export const metadata: Metadata = {
  title: `Effectif Mission Locale | Tableau de bord de l'apprentissage`,
};

export default async function Page() {
  return <MissionLocaleEffectifClient />;
}
