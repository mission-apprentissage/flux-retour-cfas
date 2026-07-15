import { Metadata } from "next";

import { SouhaiteRdvBanner } from "@/app/_components/ruptures/mission-locale/SouhaiteRdvBanner";

import MissionLocaleClient from "./MissionLocaleClient";
import { MlContainer } from "./MlContainer";

export const metadata: Metadata = {
  title: "Ruptures de contrat | Tableau de bord de l'apprentissage",
};

// Bandeau "souhaite un RDV" en haut de l'accueil Mission Locale.
// Masqué temporairement (comptage en cours de fiabilisation) — repasser à `true` pour le réactiver.
const SOUHAITE_RDV_BANNER_ENABLED = false;

export default function Page() {
  return (
    <>
      {SOUHAITE_RDV_BANNER_ENABLED && <SouhaiteRdvBanner />}
      <MlContainer>
        <MissionLocaleClient />
      </MlContainer>
    </>
  );
}
