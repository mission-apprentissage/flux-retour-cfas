const baseStyle = {
  fontWeight: "400",
  fontFamily: "Marianne",
  borderRadius: "0",
  paddingX: "2w",
  lineHeight: "1.4",
  color: "grey.800",
  _hover: { textDecoration: "underline" },
};

export const Button = {
  variants: {
    unstyled: baseStyle,
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
    ghost: {
      ...baseStyle,
      border: "solid 1px",
      background: "transparent",
      borderColor: "bluefrance",
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
  },
  defaultProps: {
    variant: "unstyled",
  },
};
