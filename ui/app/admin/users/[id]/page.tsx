import { Metadata } from "next";

import UserAdminClient from "./UserAdminClient";

export const metadata: Metadata = {
  title: "Utilisateur | Tableau de bord de l'apprentissage",
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <UserAdminClient id={id} />;
}
