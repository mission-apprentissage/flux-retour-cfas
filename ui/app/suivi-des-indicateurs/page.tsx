import { Suspense } from "react";

import { VueEnsembleView } from "@/app/_components/statistiques/views/VueEnsembleView";
import { getSession } from "@/app/_utils/session.utils";

import { isAdminUser, isIndicateursUser } from "./access";

export default async function StatistiquesMLPage() {
  const user = await getSession();

  return (
    <Suspense>
      <VueEnsembleView isPublic={!isIndicateursUser(user)} isAdmin={isAdminUser(user)} />
    </Suspense>
  );
}
