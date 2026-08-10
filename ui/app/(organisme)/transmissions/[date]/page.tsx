import { redirect } from "next/navigation";

import TransmissionsDetailsClient from "@/app/_components/transmissions/TransmissionsDetailsClient";
import { PAGES } from "@/app/_utils/routes.utils";
import { getSession } from "@/app/_utils/session.utils";

export async function generateMetadata({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  return PAGES.dynamic.transmissionsJour({ date }).getMetadata();
}

export default async function TransmissionsJourPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const user = await getSession();
  const organisation = user?.organisation;
  const organismeId = organisation && "organisme_id" in organisation ? organisation.organisme_id : null;

  if (!organismeId) {
    redirect("/home");
  }

  return (
    <div className="fr-container fr-pt-3w fr-pb-6w">
      <TransmissionsDetailsClient date={date} />
    </div>
  );
}
