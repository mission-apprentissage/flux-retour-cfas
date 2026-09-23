import { redirect } from "next/navigation";
import { ORGANISATION_TYPE } from "shared";

import fond from "@/app/_components/layouts/fond.module.css";
import { isEnTravaux } from "@/app/_components/travaux/isEnTravaux";
import { TravauxPageClient } from "@/app/_components/travaux/TravauxPageClient";
import { getSession } from "@/app/_utils/session.utils";

export default async function OrganismesLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  const organisationType = user?.organisation?.type;

  // L'URL reste valide pour les DREETS/DDETS, mais sans le fond ni les écrans de la page d'origine.
  if (isEnTravaux(organisationType)) {
    return <TravauxPageClient />;
  }

  if (organisationType !== ORGANISATION_TYPE.ADMINISTRATEUR && organisationType !== ORGANISATION_TYPE.TETE_DE_RESEAU) {
    redirect("/");
  }

  return <div className={fond.fond}>{children}</div>;
}
