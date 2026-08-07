import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { ORGANISATION_TYPE } from "shared";

import { ConnectedHeader } from "@/app/_components/ConnectedHeader";
import { UserContextProvider } from "@/app/_components/context/UserContext";
import { Footer } from "@/app/_components/Footer";
import { getSession } from "@/app/_utils/session.utils";
import { Providers } from "@/app/providers";

import styles from "./voeux-affelnet.module.scss";

const ALLOWED_ORGANISATION_TYPES: string[] = [ORGANISATION_TYPE.DREETS, ORGANISATION_TYPE.ACADEMIE];

export default async function VoeuxAffelnetLayout({ children }: { children: ReactNode }) {
  const user = await getSession();

  if (!user) {
    redirect("/auth/connexion");
  }

  if (!ALLOWED_ORGANISATION_TYPES.includes(user.organisation?.type as string)) {
    redirect("/home");
  }

  return (
    <Providers>
      <UserContextProvider user={user}>
        <div className={styles.layout}>
          <ConnectedHeader />
          <div className={styles.main}>{children}</div>
          <Footer />
        </div>
      </UserContextProvider>
    </Providers>
  );
}
