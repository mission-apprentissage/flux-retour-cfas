import { Suspense } from "react";

import { RegionView } from "@/app/_components/statistiques/views/RegionView";
import { getSession } from "@/app/_utils/session.utils";

import { isAdminUser } from "../../access";

interface RegionDetailPageProps {
  params: Promise<{
    code: string;
  }>;
}

export default async function RegionDetailMLPage({ params }: RegionDetailPageProps) {
  const [{ code }, user] = await Promise.all([params, getSession()]);

  return (
    <Suspense>
      <RegionView regionCode={code} isAdmin={isAdminUser(user)} />
    </Suspense>
  );
}
