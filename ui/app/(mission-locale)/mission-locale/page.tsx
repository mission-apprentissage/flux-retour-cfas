import { Metadata } from "next";

import { SouhaiteRdvBanner } from "@/app/_components/ruptures/mission-locale/SouhaiteRdvBanner";

import MissionLocaleClient from "./MissionLocaleClient";
import { MlContainer } from "./MlContainer";

export const metadata: Metadata = {
  title: "Ruptures de contrat | Tableau de bord de l'apprentissage",
};

export default function Page() {
  return (
    <>
      <SouhaiteRdvBanner />
      <MlContainer>
        <MissionLocaleClient />
      </MlContainer>
    </>
  );
}
