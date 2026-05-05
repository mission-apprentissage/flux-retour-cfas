"use client";

import { ConnexionSection } from "./(generique)/_components/ConnexionSection";
import { FooterCTASection } from "./(generique)/_components/FooterCTASection";
import { HeroSection } from "./(generique)/_components/HeroSection";
import { SponsorsSection } from "./(generique)/_components/SponsorsSection";
import { FAQSection } from "./_components/FAQSection";
import { RupturesContratSection } from "./_components/RupturesContratSection";
import { TemoignagesSection } from "./_components/TemoignagesSection";
import { VideoSection } from "./_components/VideoSection";
import landingStyles from "./landing-page.module.scss";

export default function HomePageClient() {
  return (
    <main id="accueil-content" className={landingStyles.mainContainer}>
      <HeroSection />
      <SponsorsSection />
      <RupturesContratSection
        title="180 000 jeunes en rupture de contrat d’apprentissage chaque année*"
        description={
          "Le Tableau de bord connecte les acteurs du service public à l’emploi et de l’apprentissage pour qu’aucune rupture ne se solde en échec et que chacun ait une chance d’avoir un accompagnement global."
        }
      />
      <ConnexionSection />
      <VideoSection />
      <TemoignagesSection />
      <FAQSection />
      <FooterCTASection />
    </main>
  );
}
