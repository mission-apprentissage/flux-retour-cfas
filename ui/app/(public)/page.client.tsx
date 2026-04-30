"use client";

import { ConnexionSection } from "./_components/ConnexionSection";
import { FAQSection } from "./_components/FAQSection";
import { FooterCTASection } from "./_components/FooterCTASection";
import { HeroSection } from "./_components/HeroSection";
import { RupturesContratSection } from "./_components/RupturesContratSection";
import { SponsorsSection } from "./_components/SponsorsSection";
import { TemoignagesSection } from "./_components/TemoignagesSection";
import { VideoSection } from "./_components/VideoSection";
import homeStyles from "./home.module.scss";

export default function HomePageClient() {
  return (
    <main id="accueil-content" className={homeStyles.mainContainer}>
      <HeroSection />
      <SponsorsSection />
      <RupturesContratSection />
      <ConnexionSection />
      <VideoSection />
      <TemoignagesSection />
      <FAQSection />
      <FooterCTASection />
    </main>
  );
}
