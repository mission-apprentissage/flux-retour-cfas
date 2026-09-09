import { PAGES } from "@/app/_utils/routes.utils";

import OrganismeDoublonsPageClient from "./OrganismeDoublonsPageClient";

export async function generateMetadata({ params }: { params: Promise<{ organismeId: string }> }) {
  const { organismeId } = await params;
  return PAGES.dynamic.organismeEffectifsDoublons({ organismeId }).getMetadata();
}

export default async function OrganismeDoublonsPage({ params }: { params: Promise<{ organismeId: string }> }) {
  const { organismeId } = await params;

  return (
    <>
      <OrganismeDoublonsPageClient organismeId={organismeId} />
    </>
  );
}
