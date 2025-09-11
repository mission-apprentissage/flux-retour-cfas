import { Metadata } from "next";

import CfaDetailClient from "./CfaDetailClient";

export const metadata: Metadata = {
  title: `CFA | Tableau de bord de l'apprentissage`,
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CfaDetailClient id={id} />;
}
