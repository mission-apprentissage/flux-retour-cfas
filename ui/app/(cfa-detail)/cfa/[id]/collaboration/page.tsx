import { Metadata } from "next";

import CollaborationFormPage from "./CollaborationFormPage";

export const metadata: Metadata = {
  title: `CFA | Démarrer une collaboration`,
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CollaborationFormPage id={id} />;
}
