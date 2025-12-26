import type { Metadata } from "next";
import { ORGANISATION_TYPE } from "shared";

import { ConnectedHeader } from "@/app/_components/ConnectedHeader";
import { UserContextProvider } from "@/app/_components/context/UserContext";
import { Footer } from "@/app/_components/Footer";
import { PublicHeaderWithoutAuth } from "@/app/_components/PublicHeaderWithoutAuth";
import { getSession } from "@/app/_utils/session.utils";
import { Providers } from "@/app/providers";

import { StatistiquesMLLayoutClient } from "./StatistiquesMLLayoutClient";
import { StatistiquesPublicLayoutClient } from "./StatistiquesPublicLayoutClient";

export const metadata: Metadata = {
  title: "Suivi des indicateurs | Tableau de bord de l'apprentissage",
};

const ALLOWED_ORGANISATION_TYPES = [ORGANISATION_TYPE.ARML, ORGANISATION_TYPE.DREETS, ORGANISATION_TYPE.DDETS];

export default async function StatistiquesLayout({ children }: { children: JSX.Element }) {
  const user = await getSession();

  const isConnected =
    user && ALLOWED_ORGANISATION_TYPES.includes(user.organisation?.type as (typeof ALLOWED_ORGANISATION_TYPES)[number]);

  if (isConnected) {
    return (
      <Providers>
        <UserContextProvider user={user}>
          <ConnectedHeader />
          <StatistiquesMLLayoutClient>{children}</StatistiquesMLLayoutClient>
          <Footer />
        </UserContextProvider>
      </Providers>
    );
  }

  return (
    <Providers>
      <PublicHeaderWithoutAuth />
      <StatistiquesPublicLayoutClient>{children}</StatistiquesPublicLayoutClient>
      <Footer />
    </Providers>
  );
}
