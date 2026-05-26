import { Metadata } from "next";

import BrevoContactListsClient from "./BrevoContactListsClient";

export const metadata: Metadata = {
  title: "Listes de contacts Brevo | Tableau de bord de l'apprentissage",
};

export default function Page() {
  return <BrevoContactListsClient />;
}
