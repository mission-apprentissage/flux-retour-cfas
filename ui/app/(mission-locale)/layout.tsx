import dynamic from "next/dynamic";

import { ConnectedHeader } from "../_components/ConnectedHeader";
import { UserContextProvider } from "../_components/context/UserContext";
import { Footer } from "../_components/Footer";
import fond from "../_components/layouts/fond.module.css";
import { getSession } from "../_utils/session.utils";
import { Providers } from "../providers";

const CrispChatNoSSR = dynamic(() => import("../_components/CrispChat").then((mod) => mod.CrispChat));

export default async function RootLayout({ children }: { children: JSX.Element }) {
  const user = await getSession();

  return (
    <Providers>
      <UserContextProvider user={user}>
        <div className={fond.page}>
          <ConnectedHeader />
          <main id="contenu" tabIndex={-1} className={fond.fond}>
            {children}
          </main>
          <Footer />
        </div>
        <CrispChatNoSSR />
      </UserContextProvider>
    </Providers>
  );
}
