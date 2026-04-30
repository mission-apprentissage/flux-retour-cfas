import { Footer } from "../_components/Footer";
import { PublicHeader } from "../_components/PublicHeader";
import { Providers } from "../providers";

import styles from "./layout.module.scss";

export default async function RootLayout({ children }: { children: JSX.Element }) {
  return (
    <Providers>
      <div className={styles.layout}>
        <PublicHeader />
        <div className={styles.main}>{children}</div>
        <Footer />
      </div>
    </Providers>
  );
}
