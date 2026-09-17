import { Metadata } from "next";

import styles from "@/app/_components/layouts/pageContainer.module.css";

import { UserContextProvider } from "../_components/context/UserContext";
import { Footer } from "../_components/Footer";
import { getSession } from "../_utils/session.utils";
import { Providers } from "../providers";

import { DecommissionnementHeader } from "./DecommissionnementHeader";

export const metadata: Metadata = {
  title: "Service indisponible - Tableau de bord de l'apprentissage",
};

export default async function DecommissionnementLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();

  return (
    <Providers>
      <UserContextProvider user={user}>
        <DecommissionnementHeader />
        <div className={styles.containerGrow}>{children}</div>
        <Footer />
      </UserContextProvider>
    </Providers>
  );
}
