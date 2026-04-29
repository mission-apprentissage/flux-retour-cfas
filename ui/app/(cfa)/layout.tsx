import dynamic from "next/dynamic";

import { ConnectedHeader } from "../_components/ConnectedHeader";
import { UserContextProvider } from "../_components/context/UserContext";
import { Footer } from "../_components/Footer";
import { CfaInviteBanner } from "../_components/ruptures/cfa/CfaInviteBanner";
import { getSession } from "../_utils/session.utils";
import { Providers } from "../providers";

const CrispChatNoSSR = dynamic(() => import("../_components/CrispChat").then((mod) => mod.CrispChat));

export default async function RootLayout({ children }: { children: JSX.Element }) {
  const user = await getSession();

  return (
    <Providers>
      <UserContextProvider user={user}>
        <ConnectedHeader />
        <CfaInviteBanner />
        <div
          style={{
            flex: 1,
            background: "linear-gradient(180deg, #F6F6F6 5.73%, #F5F5FE 41.13%)",
          }}
        >
          {children}
        </div>
        <Footer />
        <CrispChatNoSSR />
      </UserContextProvider>
    </Providers>
  );
}
