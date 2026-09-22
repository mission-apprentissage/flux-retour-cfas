import { getSession } from "../../_utils/session.utils";
import { Providers } from "../../providers";
import { ConnectedHeader } from "../ConnectedHeader";
import { UserContextProvider } from "../context/UserContext";
import { Footer } from "../Footer";

import styles from "./DetailLayout.module.css";

export async function DetailLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();

  return (
    <Providers>
      <UserContextProvider user={user}>
        <div className={styles.viewport}>
          <ConnectedHeader withNav={false} />
          <main id="contenu" tabIndex={-1} className={styles.main}>
            {children}
          </main>
        </div>
        <Footer compact />
      </UserContextProvider>
    </Providers>
  );
}
