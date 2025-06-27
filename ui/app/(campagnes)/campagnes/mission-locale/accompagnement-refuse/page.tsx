import { Metadata } from "next";

import AccompagnementRefuseClient from "./AccompagnementRefuseClient";

export const metadata: Metadata = {
  title: "Accompagnement refusé | Tableau de bord de l'apprentissage",
};

export default function Page() {
  return <AccompagnementRefuseClient />;
}
