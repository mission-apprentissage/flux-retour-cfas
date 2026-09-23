import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { ORGANISATION_TYPE } from "shared";

import { ConnectedHeader } from "@/app/_components/ConnectedHeader";
import { UserContextProvider } from "@/app/_components/context/UserContext";
import { Footer } from "@/app/_components/Footer";
import { isEnTravaux } from "@/app/_components/travaux/isEnTravaux";
import { TravauxPageClient } from "@/app/_components/travaux/TravauxPageClient";
import { TravauxBanner } from "@/app/_components/TravauxBanner";
import { getSession } from "@/app/_utils/session.utils";
import { Providers } from "@/app/providers";

import styles from "./voeux-affelnet.module.scss";

const ALLOWED_ORGANISATION_TYPES: string[] = [ORGANISATION_TYPE.ACADEMIE];

export default async function VoeuxAffelnetLayout({ children }: { children: ReactNode }) {
  const user = await getSession();

  if (!user) {
    redirect("/auth/connexion");
  }

  const organisationType = user.organisation?.type;
  const enTravaux = isEnTravaux(organisationType);

  if (!ALLOWED_ORGANISATION_TYPES.includes(organisationType as string) && !enTravaux) {
    redirect("/");
  }

  return (
    <Providers>
      <UserContextProvider user={user}>
        <div className={styles.layout}>
          <TravauxBanner />
          <ConnectedHeader />
          {enTravaux ? <TravauxPageClient /> : <div className={styles.main}>{children}</div>}
          <Footer />
        </div>
      </UserContextProvider>
    </Providers>
  );
}
