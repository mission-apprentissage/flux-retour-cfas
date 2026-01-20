import { Metadata } from "next";

import InscriptionMLClient from "./InscriptionMLClient";

export const metadata: Metadata = {
  title: "Inscription Missions Locales | Tableau de bord de l'apprentissage",
};

export default function InscriptionMLPage() {
  return <InscriptionMLClient />;
}
