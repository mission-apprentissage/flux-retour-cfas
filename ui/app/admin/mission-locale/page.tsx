import { Metadata } from "next";

import UNMLAdminClient from "./UNMLAdminClient";

export const metadata: Metadata = {
  title: "Missions Locales | Tableau de bord de l'apprentissage",
};

export default function Page() {
  return <UNMLAdminClient />;
}
