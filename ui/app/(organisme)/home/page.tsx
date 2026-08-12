import { PAGES } from "@/app/_utils/routes.utils";

import HomePageClient from "./HomePageClient";

export const metadata = PAGES.static.tableauDeBord.getMetadata();

export default function HomePage() {
  return <HomePageClient />;
}
