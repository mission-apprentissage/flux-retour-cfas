import { formatDate } from "@/app/_utils/date.utils";
import { PAGES } from "@/app/_utils/routes.utils";

import TransmissionsJourAdminClient from "./TransmissionsJourAdminClient";

function getDateLabel(date: string) {
  return Number.isNaN(new Date(date).getTime()) ? undefined : formatDate(date);
}

export async function generateMetadata({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  return PAGES.dynamic.adminTransmissionsJour({ date, label: getDateLabel(date) }).getMetadata();
}

export default async function Page({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  return <TransmissionsJourAdminClient date={date} />;
}
