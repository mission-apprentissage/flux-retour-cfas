import { redirect } from "next/navigation";
import { ORGANISATION_TYPE } from "shared";

import styles from "@/app/_components/layouts/pageContainer.module.css";

import { ConnectedHeader } from "../_components/ConnectedHeader";
import { UserContextProvider } from "../_components/context/UserContext";
import { Footer } from "../_components/Footer";
import { getSession } from "../_utils/session.utils";
import { Providers } from "../providers";

export default async function RootLayout({ children }: { children: JSX.Element }) {
  const user = await getSession();

  if (user?.organisation?.type !== ORGANISATION_TYPE.ADMINISTRATEUR) {
    redirect("/auth/connexion");
  }

  return (
    <Providers>
      <UserContextProvider user={user}>
        <ConnectedHeader />
        <div className={styles.containerGrow}>{children}</div>
        <Footer />
      </UserContextProvider>
    </Providers>
  );
}
