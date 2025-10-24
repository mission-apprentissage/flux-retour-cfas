import { Metadata } from "next";

import EffectifTraiteDetailClient from "./EffectifTraiteDetailClient";

export const metadata: Metadata = {
  title: "Détail de l'effectif traité - France Travail",
};

export default function EffectifTraiteDetailPage() {
  return <EffectifTraiteDetailClient />;
}
