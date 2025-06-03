import { fr } from "@codegouvfr/react-dsfr";
import { Stack } from "@mui/material";
import Grid from "@mui/material/Grid2";

import { Footer } from "@/app/_components/Footer";
import { HeaderCampagnes } from "@/app/_components/HeaderCampagnes";
import { Providers } from "@/app/providers";

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
        <Grid container maxWidth="md" margin="auto" sx={{ padding: "0 16px" }}>
          <Stack spacing={3} sx={{ width: "100%" }}>
            {children}
          </Stack>
        </Grid>
      </div>
      <Footer />
    </Providers>
  );
}
