import { redirect } from "next/navigation";
import { ORGANISATION_TYPE } from "shared";

import { NationalView } from "@/app/_components/statistiques/views/NationalView";
import { getSession } from "@/app/_utils/session.utils";

export default async function NationalPage() {
  const user = await getSession();

  if (user?.organisation?.type !== ORGANISATION_TYPE.ADMINISTRATEUR) {
    redirect("/suivi-des-indicateurs");
  }

  return <NationalView />;
}
