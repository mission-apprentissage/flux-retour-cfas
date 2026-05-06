import { Metadata } from "next";

import { ConnexionSection } from "./_components/ConnexionSection";
import { FooterCTASection } from "./_components/FooterCTASection";
import { HeroSection } from "./_components/HeroSection";
import { BaseRupturesContratSection } from "./_components/shared/BaseRupturesContratSection";
import { FAQSection } from "./_components/shared/FAQSection";
import { TemoignagesSection } from "./_components/shared/TemoignagesSection";
import { VideoSection } from "./_components/shared/VideoSection";
import { SponsorsSection } from "./_components/SponsorsSection";
import landingStyles from "./landing-page.module.scss";

export const metadata: Metadata = {
  title: "Accueil | Tableau de bord de l'apprentissage",
};

export default function HomePage() {
  return (
    <main id="accueil-content" className={landingStyles.mainContainer}>
      <HeroSection />
      <SponsorsSection />
      <BaseRupturesContratSection
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
