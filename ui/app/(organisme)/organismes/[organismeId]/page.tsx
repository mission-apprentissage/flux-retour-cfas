import { PAGES } from "@/app/_utils/routes.utils";

import OrganismeDashboardPageClient from "./OrganismeDashboardPageClient";

export async function generateMetadata({ params }: { params: Promise<{ organismeId: string }> }) {
  const { organismeId } = await params;
  return PAGES.dynamic.organisme({ organismeId }).getMetadata();
}

export default async function OrganismeDashboardPage({ params }: { params: Promise<{ organismeId: string }> }) {
  const { organismeId } = await params;

  return <OrganismeDashboardPageClient organismeId={organismeId} />;
}
