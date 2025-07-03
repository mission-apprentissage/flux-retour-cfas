import { Metadata } from "next";

import ARMLClient from "./ARMLClient";

export const metadata: Metadata = {
  title: "ARML | Tableau de bord de l'apprentissage",
};

export default function Page() {
  return <ARMLClient />;
}
