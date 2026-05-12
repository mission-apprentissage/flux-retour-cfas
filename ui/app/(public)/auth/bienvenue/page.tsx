import { PAGES } from "@/app/_utils/routes.utils";

import BienvenueClient from "./BienvenueClient";

export const metadata = PAGES.static.authBienvenue.getMetadata();

export default function Page() {
  return <BienvenueClient />;
}
