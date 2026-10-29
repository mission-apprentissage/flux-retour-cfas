import { PAGES } from "@/app/_utils/routes.utils";

import DemandesActivationClient from "./DemandesActivationClient";

export const metadata = PAGES.static.adminDemandesActivation.getMetadata();

export default function Page() {
  return <DemandesActivationClient />;
}
