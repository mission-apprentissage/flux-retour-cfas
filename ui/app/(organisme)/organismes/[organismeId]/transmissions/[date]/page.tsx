import TransmissionsDetailsClient from "@/app/_components/transmissions/TransmissionsDetailsClient";
import { PAGES } from "@/app/_utils/routes.utils";

export async function generateMetadata({ params }: { params: Promise<{ organismeId: string; date: string }> }) {
  const { organismeId, date } = await params;
  return PAGES.dynamic.organismeTransmissionsJour({ organismeId, date }).getMetadata();
}

export default async function OrganismeTransmissionsJourPage({
  params,
}: {
  params: Promise<{ organismeId: string; date: string }>;
}) {
  const { organismeId, date } = await params;

  return (
    <>
      <TransmissionsDetailsClient modePublique organismeId={organismeId} date={date} />
    </>
  );
}
