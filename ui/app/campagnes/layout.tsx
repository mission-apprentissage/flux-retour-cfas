import { fr } from "@codegouvfr/react-dsfr";

import { Footer } from "../_components/Footer";
import { HeaderCampagnes } from "../_components/HeaderCampagnes";
import { Providers } from "../providers";

export default async function RootLayout({ children }: { children: JSX.Element }) {
  return (
    <Providers>
      <HeaderCampagnes />
      <div
        style={{
          flex: 1,
          margin: "auto",
          maxWidth: 1232,
          ...fr.spacing("padding", {
            topBottom: "10v",
          }),
        }}
      >
        {children}
      </div>
      <Footer />
    </Providers>
  );
}
