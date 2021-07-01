import { extendTheme } from "@chakra-ui/react";

import components from "./components";

const rootFontSizePx = 16;

const colors = {
  bluefrance: "#000091",
  white: "#ffffff",
  redmarianne: "#e1000f",
  success: "#0d6635",
  error: "#b60000",
  warning: "#fa5c00",
  info: "#3a55d1",
  galt: "#f9f8f6",
  // hack so we can use bluefrance color in Progress component which only accepts a colorScheme prop
  main: {
    900: "#000091",
    800: "#000091",
    700: "#000091",
    600: "#000091",
    500: "#000091",
    400: "#000091",
    300: "#000091",
    200: "#000091",
    100: "#000091",
  },
  grey: {
    800: "#1e1e1e",
    750: "#2a2a2a",
    700: "#383838",
    600: "#6a6a6a",
    500: "#9c9c9c",
    400: "#cecece",
    300: "#e7e7e7",
    200: "#f0f0f0",
    100: "#f8f8f8",
  },
  greenwarm: {
    600: "#877e59",
    500: "#958b62",
    400: "#cac5b1",
    300: "#e5e2d8",
    200: "#f4f3ef",
  },
  greenlight: {
    600: "#88a34a",
    500: "#91ae4f",
    400: "#c8d7a7",
    300: "#e3ebd3",
    200: "#f4f7ed",
  },
  greenmedium: {
    600: "#19905b",
    500: "#169b62",
    400: "#8bcdb1",
    300: "#c5e6d8",
    200: "#e8f5ef",
  },
  greendark: {
    600: "#40605b",
    500: "#466964",
    400: "#a3b4b2",
    300: "#d1dad8",
    200: "#edf0f0",
  },
  greensoft: {
    750: "#22967e",
    500: "#00ac8c",
    300: "#80d6c6",
    200: "#bfeae2",
    100: "#e5f7f4",
  },
  bluesoft: {
    500: "#5266a1",
    400: "#5770be",
    300: "#abb8de",
    200: "#d5dbef",
    100: "#eef1f8",
    50: "#f9fafc",
  },
  bluedark: {
    600: "#444871",
    500: "#484d7a",
    400: "#a4a6bc",
    300: "#d5dbef",
    200: "#eef1f8",
  },
  pinksoft: {
    600: "#d07c75",
    500: "#ff8d7e",
    400: "#ffc6bf",
    300: "#ffe2df",
    200: "#fff4f2",
  },
  pinkdark: {
    600: "#c0806f",
    500: "#d08a77",
    400: "#e7c4bb",
    300: "#f3e2dd",
    200: "#faf3f1",
  },
  pinklight: {
    600: "#ddb094",
    500: "#ffc29e",
    400: "#ffe0cf",
    300: "#fff0e7",
    200: "#fff9f5",
  },
  yellowmedium: {
    600: "#ead737",
    500: "#ffe800",
    400: "#fff480",
    300: "#fff9bf",
    200: "#fffde5",
  },
  yellowdark: {
    600: "#e3bd41",
    500: "#fdcf41",
    400: "#fff480",
    300: "#fff9bf",
    200: "#fffde5",
  },
  orangemedium: {
    600: "#d38742",
    500: "#ff9940",
    400: "#ffcc9f",
    300: "#ffe5cf",
    200: "#fff5ec",
  },
  orangedark: {
    600: "#d0805b",
    500: "#e18b63",
    400: "#f0c5b1",
    300: "#f8e2d8",
    200: "#fcf3ef",
  },
  orangesoft: {
    600: "#cb634b",
    500: "#ff6f4c",
    400: "#ffb7a5",
    300: "#ffdbd2",
    200: "#fff1ed",
  },
  purple: {
    600: "#714753",
    500: "#7d4e5b",
    400: "#bea6ad",
    300: "#ded3d6",
    200: "#f2edef",
  },
  brown: {
    600: "#956052",
    500: "#a26959",
    400: "#d0b4ac",
    300: "#e8dad6",
    200: "#f6f0ee",
  },
  bluegrey: {
    200: "#eef1f8",
    100: "#f9fafc",
  },
};

const fontSizes = {
  giga: `${76 / rootFontSizePx}rem`,
  mega: `${54 / rootFontSizePx}rem`,
  alpha: `${32 / rootFontSizePx}rem`,
  beta: `${24 / rootFontSizePx}rem`,
  gamma: `${20 / rootFontSizePx}rem`,
  delta: `${18 / rootFontSizePx}rem`,
  epsilon: `${16 / rootFontSizePx}rem`,
  zeta: `${14 / rootFontSizePx}rem`,
  omega: `${12 / rootFontSizePx}rem`,
  caption: `${11 / rootFontSizePx}rem`,
  legal: `${10 / rootFontSizePx}rem`,
};

const fonts = {
  body: "Marianne, Arial",
  heading: "Marianne, Arial",
};

const styles = {
  global: {
    "html, body": {
      fontFamily: "Marianne, Arial",
      background: "white",
      color: "bluefrance",
    },
  },
};

const textStyles = {
  h1: {
    fontSize: "alpha",
    fontWeight: "700",
    color: "grey.800",
    lineHeight: "1.4",
  },
  h2: {
    fontSize: "beta",
    fontWeight: "700",
    color: "grey.800",
    lineHeight: "1.4",
  },
  h3: {
    fontSize: "gamma",
    fontWeight: "700",
    color: "grey.800",
    lineHeight: "1.4",
  },
};

const space = {
  0: "0",
  "1v": "4px",
  "1w": "8px",
  "3v": "12px",
  "2w": "16px",
  "3w": "24px",
  "4w": "32px",
  "5w": "40px",
  "6w": "48px",
  "7w": "56px",
  "8w": "64px",
  "9w": "72px",
  "10w": "80px",
  "12w": "96px",
  "15w": "120px",
};

const theme = extendTheme({ fonts, colors, styles, fontSizes, textStyles, space, components });

export default theme;
