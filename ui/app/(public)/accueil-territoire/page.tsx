import { PAGES } from "@/app/_utils/routes.utils";

import { BaseRupturesContratSection } from "../_components/shared/BaseRupturesContratSection";
import { EtablissementsConnectesSection } from "../_components/shared/EtablissementsConnectesSection";
import { FAQSection } from "../_components/shared/FAQSection";
import { FooterCTASection } from "../_components/shared/FooterCTASection";
import { TemoignagesSection } from "../_components/shared/TemoignagesSection";
import { VideoSection } from "../_components/shared/VideoSection";
import landingStyles from "../landing-page.module.scss";

import { AccesDonneesSection } from "./_components/AccesDonneesSection";
import { HeroSection } from "./_components/HeroSection";
import { MapStatsSection } from "./_components/MapStatsSection";

export const metadata = PAGES.static.accueilTerritoire.getMetadata();

export default function AccueilTerritoirePage() {
  return (
    <main id="accueil-territoire-content" className={landingStyles.mainContainer}>
      <HeroSection />
      <EtablissementsConnectesSection />
      <MapStatsSection />
      <AccesDonneesSection />
      <BaseRupturesContratSection
        title="180 000 jeunes en rupture de contrat d’apprentissage chaque année*"
        description="Une grande partie d’entre eux ne bénéficie d’aucun accompagnement. Les relations entre les CFA, les Missions Locales et l’ensemble des acteurs territoriaux existent déjà, le Tableau de bord leur donne un espace de centralisation pour faciliter l’accès à l’information et la collaboration."
      />
      <VideoSection />
      <TemoignagesSection linkInscription="operateur_public" />
      <FAQSection />
      <FooterCTASection linkInscription="operateur_public" />
    </main>
  );
}
