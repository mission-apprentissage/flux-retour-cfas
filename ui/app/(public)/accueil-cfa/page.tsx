import { Metadata } from "next";

import { EtablissementsConnectesSection } from "../_components/shared/EtablissementsConnectesSection";
import { FAQSection } from "../_components/shared/FAQSection";
import { FooterCTASection } from "../_components/shared/FooterCTASection";
import { TemoignagesSection } from "../_components/shared/TemoignagesSection";
import landingStyles from "../landing-page.module.scss";

import { FeaturesSection } from "./_components/FeaturesSection";
import { HeroSection } from "./_components/HeroSection";
import { PourquoiCollaborerSection } from "./_components/PourquoiCollaborerSection";
import { ProcessusSection } from "./_components/ProcessusSection";
import { SponsorsSection } from "./_components/SponsorsSection";

export const metadata: Metadata = {
  title: "Accueil CFA | Tableau de bord de l'apprentissage",
};

export default function AccueilCfaPage() {
  return (
    <main id="accueil-cfa-content" className={landingStyles.mainContainer}>
      <HeroSection />
      <SponsorsSection />
      <EtablissementsConnectesSection />
      <FeaturesSection />
      <PourquoiCollaborerSection />
      <ProcessusSection />
      <TemoignagesSection linkInscription="/organisme_formation" />
      <FAQSection />
      <FooterCTASection linkInscription="/organisme_formation" />
    </main>
  );
}
