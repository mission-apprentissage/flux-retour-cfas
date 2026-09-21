import { Suspense } from "react";

import { MissionLocaleDetailView } from "@/app/_components/statistiques/views/MissionLocaleDetailView";
import { getSession } from "@/app/_utils/session.utils";

import { isAdminUser } from "../../access";

interface MissionLocaleDetailPageProps {
  params: Promise<{
    mlId: string;
  }>;
}

export default async function MissionLocaleDetailMLPage({ params }: MissionLocaleDetailPageProps) {
  const [{ mlId }, user] = await Promise.all([params, getSession()]);

  return (
    <Suspense>
      <MissionLocaleDetailView mlId={mlId} isAdmin={isAdminUser(user)} />
    </Suspense>
  );
}
