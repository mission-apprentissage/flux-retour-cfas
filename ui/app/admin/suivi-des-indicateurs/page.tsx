import { Suspense } from "react";

import { VueEnsembleView } from "@/app/_components/statistiques/views/VueEnsembleView";

export default function StatistiquesPage() {
  return (
    <Suspense>
      <VueEnsembleView isAdmin />
    </Suspense>
  );
}
