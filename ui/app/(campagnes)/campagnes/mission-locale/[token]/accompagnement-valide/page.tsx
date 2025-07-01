import { Metadata } from "next";

import AccompagnementValideClient from "./AccompagnementValideClient";

export const metadata: Metadata = {
  title: `Accompagnement validé | Tableau de bord de l'apprentissage`,
};

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <AccompagnementValideClient token={token} />;
}
