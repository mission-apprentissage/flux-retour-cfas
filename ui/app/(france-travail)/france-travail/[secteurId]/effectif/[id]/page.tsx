import { Metadata } from "next";

import EffectifDetailClient from "./EffectifDetailClient";

export const metadata: Metadata = {
  title: "Détail de l'effectif | Tableau de bord de l'apprentissage",
};

export default function EffectifDetailPage() {
  return <EffectifDetailClient />;
}
