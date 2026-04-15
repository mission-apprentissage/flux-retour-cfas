import { getSession } from "../../_utils/session.utils";
import { Providers } from "../../providers";
import { UserContextProvider } from "../context/UserContext";
import { Footer } from "../Footer";
import { PublicHeaderWithoutAuth } from "../PublicHeaderWithoutAuth";

export async function DetailLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();

  return (
    <Providers>
      <UserContextProvider user={user}>
        <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
          <PublicHeaderWithoutAuth />
          <div
            style={{
              flex: 1,
              background: "linear-gradient(180deg, #F6F6F6 5.73%, #F5F5FE 41.13%)",
            }}
          >
            {children}
          </div>
          <Footer />
        </div>
      </UserContextProvider>
    </Providers>
  );
}
