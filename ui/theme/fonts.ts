import localFont from "next/font/local";

export const marianne = localFont({
  variable: "--font-marianne",
  display: "swap",
  src: [
    // Light
    { path: "../public/fonts/Marianne-Light.woff2", weight: "300", style: "normal" },
    { path: "../public/fonts/Marianne-Light_Italic.woff2", weight: "300", style: "italic" },

    // Regular
    { path: "../public/fonts/Marianne-Regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/Marianne-Regular_Italic.woff2", weight: "400", style: "italic" },

    // Bold
    { path: "../public/fonts/Marianne-Bold.woff2", weight: "700", style: "normal" },
    { path: "../public/fonts/Marianne-Bold_Italic.woff2", weight: "700", style: "italic" },

    // ExtraBold
    { path: "../public/fonts/Marianne-ExtraBold.woff2", weight: "800", style: "normal" },
    { path: "../public/fonts/Marianne-ExtraBold_Italic.woff2", weight: "800", style: "italic" },
  ],
});
