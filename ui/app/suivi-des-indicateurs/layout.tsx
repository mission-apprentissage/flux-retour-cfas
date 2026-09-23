import type { Metadata } from "next";

import { ConnectedHeader } from "@/app/_components/ConnectedHeader";
import { UserContextProvider } from "@/app/_components/context/UserContext";
import { Footer } from "@/app/_components/Footer";
import { PublicHeaderWithoutAuth } from "@/app/_components/PublicHeaderWithoutAuth";
import { getSession } from "@/app/_utils/session.utils";
import { Providers } from "@/app/providers";

import { isAdminUser, isIndicateursUser } from "./access";
import { ImpersonationNotice } from "./ImpersonationNotice";
import { StatistiquesMLLayoutClient } from "./StatistiquesMLLayoutClient";
import { StatistiquesPublicLayoutClient } from "./StatistiquesPublicLayoutClient";

export const metadata: Metadata = {
  title: "Suivi des indicateurs | Tableau de bord de l'apprentissage",
};

export default async function StatistiquesLayout({ children }: { children: JSX.Element }) {
  const user = await getSession();

  if (user?.impersonating && !isIndicateursUser(user)) {
    return (
      <Providers>
        <UserContextProvider user={user}>
          <ConnectedHeader />
          <ImpersonationNotice />
          <Footer />
        </UserContextProvider>
      </Providers>
    );
  }

  if (isIndicateursUser(user)) {
    return (
      <Providers>
        <UserContextProvider user={user}>
          <ConnectedHeader />
          <StatistiquesMLLayoutClient isAdmin={isAdminUser(user)}>{children}</StatistiquesMLLayoutClient>
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
