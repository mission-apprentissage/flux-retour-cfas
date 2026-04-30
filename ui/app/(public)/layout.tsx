import { Box } from "@mui/material";

import { Footer } from "../_components/Footer";
import { PublicHeader } from "../_components/PublicHeader";
import { Providers } from "../providers";

export default async function RootLayout({ children }: { children: JSX.Element }) {
  return (
    <Providers>
      <Box
        component="div"
        sx={{
          display: "flex",
          flexDirection: "column",
          width: "100vw",
          minHeight: "100vh",
        }}
      >
        <PublicHeader />
        <div
          style={{
            minHeight: "40vh",
            flexGrow: 1,
          }}
        >
          {children}
        </div>
        <Footer />
      </Box>
    </Providers>
  );
}
