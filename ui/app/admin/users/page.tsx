import { Metadata } from "next";

import UsersAdminClient from "./UsersAdminClient";

export const metadata: Metadata = {
  title: "Utilisateurs | Tableau de bord de l'apprentissage",
};

export default function Page() {
  return <UsersAdminClient />;
}
