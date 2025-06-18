import { Metadata } from "next";

import CampagneMissionLocaleClient from "./CampagneMissionLocaleClient";

export const metadata: Metadata = {
  title: `Accompagnement Mission Locale | Tableau de bord de l'apprentissage`,
};

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <CampagneMissionLocaleClient token={token} />;
}
