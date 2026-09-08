import { getSession } from "../../_utils/session.utils";
import { Providers } from "../../providers";
import { ConnectedHeader } from "../ConnectedHeader";
import { UserContextProvider } from "../context/UserContext";
import { Footer } from "../Footer";

import fond from "./fond.module.css";

export async function DetailLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();

  return (
    <Providers>
      <UserContextProvider user={user}>
        <div className={fond.page}>
          <ConnectedHeader withNav={false} />
          <main id="contenu" tabIndex={-1} className={fond.fond}>
            {children}
          </main>
          <Footer />
        </div>
      </UserContextProvider>
    </Providers>
  );
}
