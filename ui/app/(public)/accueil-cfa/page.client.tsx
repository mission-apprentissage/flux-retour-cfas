"use client";

import { EtablissementsConnectesSection } from "../_components/EtablissementsConnectesSection";
import { FAQSection } from "../_components/FAQSection";
import { FooterCTASection } from "../_components/FooterCTASection";
import { TemoignagesSection } from "../_components/TemoignagesSection";
import landingStyles from "../landing-page.module.scss";

import { FeaturesSection } from "./_components/FeaturesSection";
import { HeroSection } from "./_components/HeroSection";
import { PourquoiCollaborerSection } from "./_components/PourquoiCollaborerSection";
import { ProcessusSection } from "./_components/ProcessusSection";
import { SponsorsSection } from "./_components/SponsorsSection";

export default function AccueilCfaPageClient() {
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
