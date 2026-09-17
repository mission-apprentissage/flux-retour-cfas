import { PAGES } from "@/app/_utils/routes.utils";

import ReseauxAdminClient from "./ReseauxAdminClient";

export const metadata = PAGES.static.adminReseaux.getMetadata();

export default function Page() {
  return <ReseauxAdminClient />;
}
