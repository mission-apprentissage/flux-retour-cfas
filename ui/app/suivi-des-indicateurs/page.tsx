import { Suspense } from "react";

import { VueEnsembleView } from "@/app/_components/statistiques/views/VueEnsembleView";
import { getSession } from "@/app/_utils/session.utils";

import { isIndicateursUser } from "./access";

export default async function StatistiquesMLPage() {
  const user = await getSession();
  const isPublic = !isIndicateursUser(user);

  return (
    <Suspense>
      <VueEnsembleView isPublic={isPublic} />
    </Suspense>
  );
}
