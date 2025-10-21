import { Metadata } from "next";

import SecteurClient from "./SecteurClient";

export const metadata: Metadata = {
  title: "Inscrits sans contrat | Tableau de bord de l'apprentissage",
};

export default function SecteurPage() {
  return <SecteurClient />;
}
