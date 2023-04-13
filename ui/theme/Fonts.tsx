import { Global } from "@emotion/react";
import React from "react";

export default function Fonts() {
  return (
    <Global
      styles={`
      /* Marianne font */
      @font-face {
        font-family: "Marianne";
        src: local("Marianne-Regular"), local("Marianne Regular"), url(/fonts/Marianne-Regular.woff2) format("woff2"),
          url(/fonts/Marianne-Regular.woff) format("woff");
        font-weight: 400;
        font-display: swap;
      }
      
      @font-face {
        font-family: "Marianne";
        src: local("Marianne-Regular_Italic"), local("Marianne Regular Italic"),
          url(/fonts/Marianne-Regular_Italic.woff2) format("woff2"), url(/fonts/Marianne-Regular_Italic.woff) format("woff");
        font-style: italic;
        font-weight: 400;
        font-display: swap;
      }
      
      @font-face {
        font-family: "Marianne";
        src: local("Marianne-Bold"), local("Marianne Bold"), url(/fonts/Marianne-Bold.woff2) format("woff2"),
          url(/fonts/Marianne-Bold.woff) format("woff");
        font-weight: 700;
        font-display: swap;
      }
      
      @font-face {
        font-family: "Marianne";
        src: local("Marianne-Bold_Italic"), local("Marianne Bold Italic"),
          url(/fonts/Marianne-Bold_Italic.woff2) format("woff2"), url(/fonts/Marianne-Bold_Italic.woff) format("woff");
        font-style: italic;
        font-weight: 700;
        font-display: swap;
      }
      
      @font-face {
        font-family: "Marianne";
        src: local("Marianne-ExtraBold"), local("Marianne ExtraBold"), url(/fonts/Marianne-ExtraBold.woff2) format("woff2"),
          url(/fonts/Marianne-ExtraBold.woff) format("woff");
        font-weight: 800;
        font-display: swap;
      }
      
      @font-face {
        font-family: "Marianne";
        src: local("Marianne-ExtraBold_Italic"), local("Marianne ExtraBold Italic"),
          url(/fonts/Marianne-ExtraBold_Italic.woff2) format("woff2"),
          url(/fonts/Marianne-ExtraBold_Italic.woff) format("woff");
        font-style: italic;
        font-weight: 800;
        font-display: swap;
      }
      
      @font-face {
        font-family: "Marianne";
        src: local("Marianne-Light"), local("Marianne Light"), url(/fonts/Marianne-Light.woff2) format("woff2"),
          url(/fonts/Marianne-Light.woff) format("woff");
        font-weight: 300;
        font-display: swap;
      }
      
      @font-face {
        font-family: "Marianne";
        src: local("Marianne-Light_Italic"), local("Marianne Light Italic"),
          url(/fonts/Marianne-Light_Italic.woff2) format("woff2"), url(/fonts/Marianne-Light_Italic.woff) format("woff");
        font-style: italic;
        font-weight: 300;
        font-display: swap;
      }
      `}
    />
  );
}
