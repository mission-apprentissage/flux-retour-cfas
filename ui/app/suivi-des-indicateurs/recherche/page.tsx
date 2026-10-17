"use client";

import { Suspense } from "react";

import { RechercheEtablissements } from "@/app/_components/statistiques/sections/RechercheEtablissements";
import { StatsPageHeader } from "@/app/_components/statistiques/ui/StatsPageHeader";

export default function RecherchePage() {
  return (
    <Suspense>
      <StatsPageHeader
        title="Recherchez directement une Mission Locale ou un CFA"
        description="Retrouvez ici les chiffres des indicateurs principaux du déploiement et de l'activité des Missions Locales et des CFA sur le Tableau de bord de l'apprentissage sur le territoire de votre choix."
        showFilters={false}
      />
      <RechercheEtablissements />
    </Suspense>
  );
}
