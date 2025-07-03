import { Metadata } from "next";

import ARMLMissionsLocalesClient from "./ARMLMissionsLocalesClient";

export const metadata: Metadata = {
  title: "Missions Locales | Tableau de bord de l'apprentissage",
};

export default function Page() {
  return <ARMLMissionsLocalesClient />;
}
