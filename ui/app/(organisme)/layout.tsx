import dynamic from "next/dynamic";
import { redirect } from "next/navigation";

import styles from "@/app/_components/layouts/pageContainer.module.css";

import { ConnectedHeader } from "../_components/ConnectedHeader";
import { UserContextProvider } from "../_components/context/UserContext";
import { Footer } from "../_components/Footer";
import { getSession } from "../_utils/session.utils";
import { Providers } from "../providers";

const CrispChatNoSSR = dynamic(() => import("../_components/CrispChat").then((mod) => mod.CrispChat));

export default async function RootLayout({ children }: { children: JSX.Element }) {
  const user = await getSession();

  if (!user) {
    redirect("/auth/connexion");
  }

  return (
    <Providers>
      <UserContextProvider user={user}>
        <ConnectedHeader />
        <div className={styles.grow}>{children}</div>
        <Footer />
        <CrispChatNoSSR />
      </UserContextProvider>
    </Providers>
  );
}
