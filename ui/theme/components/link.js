const Link = {
  baseStyle: {
    _focus: { boxShadow: "none", outlineColor: "none" },
    _focusVisible: { boxShadow: "0 0 0 3px #2A7FFE", outlineColor: "#2A7FFE" },
  },
  variants: {
    card: {
      p: 8,
      bg: "#F9F8F6",
      _hover: { bg: "#eceae3", textDecoration: "none" },
      display: "block",
    },
    pill: {
      borderRadius: 24,
      fontSize: "zeta",
      color: "bluefrance",
      px: 3,
      py: 1,
      _hover: { bg: "grey.200", textDecoration: "none" },
    },
    summary: {
      fontSize: "zeta",
      _hover: { textDecoration: "none", bg: "grey.200" },
      p: 2,
    },
    primary: {
      bg: "white",
      color: "bluefrance",
      whiteSpace: "nowrap",
      px: 6,
      py: 2,
      _hover: { textDecoration: "none", bg: "grey.300" },
    },
    secondary: {
      border: "1px solid white",
      bg: "transparent",
      color: "white",
      whiteSpace: "nowrap",
      px: 6,
      py: 2,
      _hover: { textDecoration: "none", bg: "#00000020" },
    },
    whiteBg: {
      border: "1px solid",
      borderColor: "bluefrance",
      bg: "#ffffff",
      color: "bluefrance",
      whiteSpace: "nowrap",
      px: 6,
      py: 2,
      _hover: { textDecoration: "none", bg: "#00000020" },
    },
  },
};

export { Link };