import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ORGANISATION_TYPE } from "shared";

import { ConnectedHeader } from "@/app/_components/ConnectedHeader";
import { UserContextProvider } from "@/app/_components/context/UserContext";
import { Footer } from "@/app/_components/Footer";
import styles from "@/app/_components/layouts/pageContainer.module.css";
import { TravauxBanner } from "@/app/_components/TravauxBanner";
import { PAGES } from "@/app/_utils/routes.utils";
import { getSession } from "@/app/_utils/session.utils";
import { Providers } from "@/app/providers";

export const metadata: Metadata = PAGES.static.travaux.getMetadata();

const ALLOWED_ORGANISATION_TYPES: string[] = [ORGANISATION_TYPE.DREETS, ORGANISATION_TYPE.DDETS];

export default async function TravauxLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();

  if (!user) {
    redirect("/auth/connexion");
  }

  if (!ALLOWED_ORGANISATION_TYPES.includes(user.organisation?.type ?? "")) {
    redirect("/");
  }

  return (
    <Providers>
      <UserContextProvider user={user}>
        <TravauxBanner />
        <ConnectedHeader />
        <main id="contenu" tabIndex={-1} className={styles.grow}>
          {children}
        </main>
        <Footer />
      </UserContextProvider>
    </Providers>
  );
}
