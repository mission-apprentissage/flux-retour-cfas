import { PAGES } from "@/app/_utils/routes.utils";

import { EtablissementsConnectesSection } from "../_components/shared/EtablissementsConnectesSection";
import { FAQSection } from "../_components/shared/FAQSection";
import { FooterCTASection } from "../_components/shared/FooterCTASection";
import { TemoignagesSection } from "../_components/shared/TemoignagesSection";
import { VideoSection } from "../_components/shared/VideoSection";
import landingStyles from "../landing-page.module.scss";

import { FeaturesSection } from "./_components/FeaturesSection";
import { HeroSection } from "./_components/HeroSection";
import { ProcessusSection } from "./_components/ProcessusSection";
import { SponsorsSection } from "./_components/SponsorsSection";

export const metadata = PAGES.static.accueilMissionLocale.getMetadata();

export default function AccueilMissionLocalePage() {
  return (
    <main id="accueil-mission-locale-content" className={landingStyles.mainContainer}>
      <HeroSection />
      <SponsorsSection />
      <EtablissementsConnectesSection />
      <FeaturesSection />
      <ProcessusSection />
      <VideoSection />
      <TemoignagesSection linkInscription="missions_locales" />
      <FAQSection />
      <FooterCTASection linkInscription="missions_locales" />
    </main>
  );
}
