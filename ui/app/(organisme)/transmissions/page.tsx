import { redirect } from "next/navigation";

import TransmissionsClient from "@/app/_components/transmissions/TransmissionsClient";
import { PAGES } from "@/app/_utils/routes.utils";
import { getSession } from "@/app/_utils/session.utils";

export const metadata = PAGES.static.transmissions.getMetadata();

export default async function TransmissionsPage() {
  const user = await getSession();
  const organisation = user?.organisation;
  const organismeId = organisation && "organisme_id" in organisation ? organisation.organisme_id : null;

  if (!organismeId) {
    redirect("/home");
  }

  return (
    <div className="fr-container fr-pt-3w fr-pb-6w">
      <TransmissionsClient />
    </div>
  );
}
