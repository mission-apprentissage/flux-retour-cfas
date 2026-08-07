import { PAGES } from "@/app/_utils/routes.utils";

import TransmissionsAdminClient from "./TransmissionsAdminClient";

export const metadata = PAGES.static.adminTransmissions.getMetadata();

export default function Page() {
  return <TransmissionsAdminClient />;
}
