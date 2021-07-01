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
        background: "bluedark.600",
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
        background: "grey.500",
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
    },
    link: {
      ...baseStyle,
      color: "bluefrance",
      border: "none",
      _hover: {
        textDecoration: "underline",
      },
    },
  },
  defaultProps: {
    variant: "unstyled",
  },
};
