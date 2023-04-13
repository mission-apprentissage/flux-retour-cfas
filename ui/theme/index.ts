import { extendTheme } from "@chakra-ui/react";
import { theme } from "@chakra-ui/theme";
import { fonts, colors, fontSizes, space, rootFontSizePx, textStyles } from "./theme-beta";
import { components } from "./components/index";

const styles = {
  global: {
    "html, body": {
      fontSize: `${rootFontSizePx}px`,
      fontFamily: "Marianne, Arial",
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

const overrides = {
  fonts,
  colors: { ...colors, ...customColors },
  styles,
  fontSizes,
  textStyles,
  space,
  components,
  sizes: {
    ...theme.sizes,
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
};

export default extendTheme(overrides);
