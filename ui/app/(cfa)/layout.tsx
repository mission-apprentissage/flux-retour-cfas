import { ConnectedHeader } from "../_components/ConnectedHeader";
import { UserContextProvider } from "../_components/context/UserContext";
import { Footer } from "../_components/Footer";
import { getSession } from "../_utils/session.utils";
import { Providers } from "../providers";

export default async function RootLayout({ children }: { children: JSX.Element }) {
  const user = await getSession();

  return (
    <Providers>
      <UserContextProvider user={user}>
        <ConnectedHeader />
        <div
          style={{
            flex: 1,
            background: "linear-gradient(180deg, #F6F6F6 5.73%, #F5F5FE 41.13%)",
          }}
        >
          {children}
        </div>
        <Footer />
      </UserContextProvider>
    </Providers>
  );
}
