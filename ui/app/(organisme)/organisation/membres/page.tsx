import { redirect } from "next/navigation";

import RolesHabilitationsClient from "@/app/_components/roles-habilitations/RolesHabilitationsClient";
import { PAGES } from "@/app/_utils/routes.utils";
import { getSession } from "@/app/_utils/session.utils";

export const metadata = PAGES.static.organisationMembres.getMetadata();

export default async function OrganisationMembresPage() {
  const user = await getSession();

  if (user?.organisation?.type === "MISSION_LOCALE") {
    redirect("/auth/connexion");
  }

  return (
    <div className="fr-container fr-pt-3w fr-pb-6w">
      <RolesHabilitationsClient description="Retrouvez ici l'ensemble des utilisateurs habilités à consulter les données de votre organisation sur le tableau de bord." />
    </div>
  );
}
