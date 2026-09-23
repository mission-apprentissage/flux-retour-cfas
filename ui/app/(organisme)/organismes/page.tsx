import { Suspense } from "react";

import OrganismesListClient from "@/app/_components/organismes/OrganismesListClient";
import { getOrganismesListTitle } from "@/app/_components/organismes/titre-liste";
import { TableSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { getSession } from "@/app/_utils/session.utils";

export async function generateMetadata() {
  const user = await getSession();
  return { title: `${getOrganismesListTitle(user?.organisation?.type)} | Tableau de bord de l'apprentissage` };
}

export default function OrganismesPage() {
  return (
    <div className="fr-container fr-pt-3w fr-pb-6w">
      <Suspense fallback={<TableSkeleton />}>
        <OrganismesListClient />
      </Suspense>
    </div>
  );
}
