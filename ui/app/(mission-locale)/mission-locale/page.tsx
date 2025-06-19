import { Metadata } from "next";

import MissionLocaleClient from "./MissionLocaleClient";

export const metadata: Metadata = {
  title: "Ruptures de contrat | Tableau de bord de l'apprentissage",
};

export default function Page() {
  return <MissionLocaleClient />;
}
