"use client";

import { EtablissementsConnectesSection } from "../_components/EtablissementsConnectesSection";
import { FAQSection } from "../_components/FAQSection";
import { FooterCTASection } from "../_components/FooterCTASection";
import { TemoignagesSection } from "../_components/TemoignagesSection";
import { VideoSection } from "../_components/VideoSection";
import landingStyles from "../landing-page.module.scss";

import { FeaturesSection } from "./_components/FeaturesSection";
import { HeroSection } from "./_components/HeroSection";
import { ProcessusSection } from "./_components/ProcessusSection";
import { SponsorsSection } from "./_components/SponsorsSection";

export default function AccueilMissionLocalePageClient() {
  return (
    <main id="accueil-mission-locale-content" className={landingStyles.mainContainer}>
      <HeroSection />
      <SponsorsSection />
      <EtablissementsConnectesSection />
      <FeaturesSection />
      <ProcessusSection />
      <VideoSection />
      <TemoignagesSection linkInscription="/missions_locales" />
      <FAQSection />
      <FooterCTASection linkInscription="/missions_locales" />
    </main>
  );
}
