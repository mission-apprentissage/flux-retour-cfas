import { extendTheme } from "@chakra-ui/react";
import { theme as baseTheme } from "@chakra-ui/theme";

import { components } from "./components/index";
import { colors, fontSizes, space, rootFontSizePx, textStyles } from "./theme-beta";

const styles = {
  global: {
    "html, body": {
      fontSize: `${rootFontSizePx}px`,
      background: "white",
      color: "primaryText",
      transition: "background-color 0.2s",
      lineHeight: "base",
    },
    "*::placeholder": {
      color: "gray.400",
    },
    "*, *::before, &::after": {
      borderColor: "gray.200",
      wordWrap: "break-word",
    },
    a: {
      color: "bluefrance",
    },
  },
};

const customColors = {
  primaryText: "grey.800",
  primaryBackground: "white",
  secondaryBackground: "#e5edef",
  blue: {
    500: "#007BFF",
  },
};

export default extendTheme({
  fonts: {
    heading: "var(--font-marianne), sans-serif",
    body: "var(--font-marianne), sans-serif",
  },
  colors: { ...colors, ...customColors },
  styles,
  fontSizes,
  textStyles,
  space,
  components,
  sizes: {
    ...baseTheme.sizes,
    xs: "20rem",
    sm: "24rem",
    md: "28rem",
    lg: "32rem",
    xl: "1280px",
    container: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
    },
  },
});
