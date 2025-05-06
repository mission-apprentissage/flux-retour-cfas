import { UserContextProvider } from "../_components/context/UserContext";
import { Footer } from "../_components/Footer";
import { PublicHeader } from "../_components/PublicHeader";
import { getSession } from "../_utils/session.utils";
import { Providers } from "../providers";

export default async function RootLayout({ children }: { children: JSX.Element }) {
  const user = await getSession();

  return (
    <Providers>
      <UserContextProvider user={user}>
        <PublicHeader />
        {children}
        <Footer />
      </UserContextProvider>
    </Providers>
  );
}
