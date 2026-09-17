import { Metadata } from "next";
import { redirect } from "next/navigation";

import { SouhaiteRdvBanner } from "@/app/_components/ruptures/mission-locale/SouhaiteRdvBanner";

import { MlContainer } from "./MlContainer";
import MlPrioritairesClient from "./MlPrioritairesClient";

export const metadata: Metadata = {
  title: "Dossiers prioritaires à traiter | Tableau de bord de l'apprentissage",
};

// Bandeau "souhaite un RDV" en haut de l'accueil Mission Locale.
// Masqué temporairement (comptage en cours de fiabilisation) — repasser à `true` pour le réactiver.
const SOUHAITE_RDV_BANNER_ENABLED = false;

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;

  // Les liens historiques (emails de récap, favoris) ciblent la liste ruptures avec ses filtres.
  const versListeRuptures = ["statut", "rupture", "filter"].some((cle) => params?.[cle] !== undefined);
  if (versListeRuptures) {
    const query = new URLSearchParams(
      Object.entries(params).flatMap(([cle, valeur]) =>
        valeur === undefined ? [] : Array.isArray(valeur) ? valeur.map((v) => [cle, v]) : [[cle, valeur]]
      ) as string[][]
    ).toString();
    redirect(`/mission-locale/ruptures${query ? `?${query}` : ""}`);
  }

  return (
    <>
      {SOUHAITE_RDV_BANNER_ENABLED && <SouhaiteRdvBanner />}
      <MlContainer>
        <MlPrioritairesClient />
      </MlContainer>
    </>
  );
}
