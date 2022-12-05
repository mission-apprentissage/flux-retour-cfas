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
    primary: {
      ...baseStyle,
      background: "bluefrance",
      color: "white",
      _hover: {
        background: "bluefrance_hover",
      },
      _disabled: {
        background: "grey.200",
        border: "none",
        color: "grey.600",
      },
    },
    ["primary-dark"]: {
      ...baseStyle,
      background: "#9a9aff",
      color: "bluefrance",
      _hover: {
        background: "#8585f6",
      },
      _disabled: {
        background: "grey.700",
        color: "grey.400",
      },
    },
    ["select-primary"]: {
      ...baseStyle,
      color: "bluefrance",
      border: "none",
      fontWeight: "700",
      fontSize: "gamma",
      paddingX: "0",
      _hover: {
        textDecoration: "none",
      },
    },
    ["select-secondary"]: {
      ...baseStyle,
      borderRadius: "40px",
      paddingY: "3v",
      backgroundColor: "grey.300",
      color: "grey.700",
      _hover: {
        background: "grey.200",
      },
      _active: {
        background: "#f2f2f9",
        border: "solid 1px",
        borderColor: "bluefrance",
      },
    },
    secondary: {
      ...baseStyle,
      border: "solid 1px",
      background: "transparent",
      borderColor: "bluefrance",
      color: "bluefrance",
      _hover: {
        background: "grey.100",
      },
      _active: {
        background: "white",
      },
      _disabled: {
        color: "grey.600",
        borderColor: "grey.400",
      },
    },
    link: {
      ...baseStyle,
      color: "bluefrance",
      border: "none",
      borderRadius: "40px",
      padding: "3v",
      _hover: {
        textDecoration: null,
        background: "grey.100",
      },
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
