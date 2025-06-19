import { Metadata } from "next";
import { API_EFFECTIF_LISTE, IEffecifMissionLocale } from "shared";

import { _get } from "@/common/httpClient";

import MissionLocaleEffectifClient from "./MissionLocaleEffectifClient";

export const metadata: Metadata = {
  title: `Effectif Mission Locale | Tableau de bord de l'apprentissage`,
};

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; effectifId: string }>;
  searchParams: Promise<{ nom_liste?: string }>;
}) {
  const { id, effectifId } = await params;
  const { nom_liste } = await searchParams;
  const nomListe = (nom_liste as API_EFFECTIF_LISTE) || API_EFFECTIF_LISTE.A_TRAITER;

  let data: IEffecifMissionLocale | null = null;
  try {
    data = await _get<IEffecifMissionLocale>(`/api/v1/admin/mission-locale/${id}/effectif/${effectifId}`, {
      params: {
        nom_liste: nomListe,
      },
    });
  } catch (error) {
    console.error("Erreur lors du chargement de l'effectif:", error);
  }

  return <MissionLocaleEffectifClient id={id} effectifId={effectifId} data={data} />;
}
