import { Suspense } from "react";

import { CfaDetailView } from "@/app/_components/statistiques/views/CfaDetailView";
import { getSession } from "@/app/_utils/session.utils";

import { isAdminUser } from "../../access";

interface CfaDetailPageProps {
  params: Promise<{ organismeId: string }>;
}

export default async function CfaDetailPage({ params }: CfaDetailPageProps) {
  const [{ organismeId }, user] = await Promise.all([params, getSession()]);

  return (
    <Suspense>
      <CfaDetailView organismeId={organismeId} isAdmin={isAdminUser(user)} />
    </Suspense>
  );
}
