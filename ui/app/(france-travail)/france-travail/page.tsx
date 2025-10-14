import { Metadata } from "next";

import FranceTravailClient from "./FranceTravailClient";

export const metadata: Metadata = {
  title: "Inscrits sans contrat | Tableau de bord de l'apprentissage",
};

export default function Page() {
  return <FranceTravailClient />;
}
