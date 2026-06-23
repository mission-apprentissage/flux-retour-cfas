import { Metadata } from "next";
import { Suspense } from "react";

import { CompteClient } from "./CompteClient";

export const metadata: Metadata = {
  title: "Mon compte | Tableau de bord de l'apprentissage",
};

export default function ComptePage() {
  // Suspense requis car CompteClient lit l'onglet actif via useSearchParams.
  return (
    <Suspense>
      <CompteClient />
    </Suspense>
  );
}
