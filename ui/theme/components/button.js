const commonButtonStyle = {
  borderRadius: 0,
  textTransform: "none",
  fontWeight: 400,
  _focus: { boxShadow: "none", outlineColor: "none" },
  _focusVisible: { boxShadow: "0 0 0 3px #2A7FFE", outlineColor: "#2A7FFE" },
};

const baseStyle = {
  fontWeight: "400",
  fontFamily: "Marianne",
  borderRadius: "0",
  paddingX: "2w",
  lineHeight: "1.4",
  color: "grey.800",
  _hover: { textDecoration: "underline" },
};

const Button = {
  variants: {
    unstyled: {
      ...commonButtonStyle,
    },
    secondary: {
      ...commonButtonStyle,
      bg: "white",
      color: "bluefrance",
      border: "1px solid",
      borderColor: "bluefrance",
      _hover: { bg: "#efefef" },
    },
    primary: {
      ...commonButtonStyle,
      bg: "bluefrance",
      color: "white",
      _hover: { bg: "#0000dd", _disabled: { bg: "bluefrance" } },
    },
    pill: {
      ...commonButtonStyle,
      borderRadius: 24,
      height: "auto",
      fontSize: "zeta",
      color: "bluefrance",
      px: 3,
      py: 1,
      _hover: { bg: "grey.200", textDecoration: "none" },
    },
    badge: {
      ...baseStyle,
      color: "bluefrance",
      backgroundColor: "#E3E3FD",
      height: "30px",
      borderRadius: "40px",
      fontSize: "zeta",
      _hover: {
        background: "#CCCCFF",
      },
    },
    badgeSelected: {
      ...baseStyle,
      color: "white",
      backgroundColor: "bluefrance",
      height: "30px",
      borderRadius: "40px",
      fontSize: "zeta",
      _hover: {
        background: "bluefrance_hover",
      },
    },
  },
};

export { Button };
