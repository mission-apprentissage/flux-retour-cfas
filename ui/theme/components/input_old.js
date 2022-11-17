const baseStyle = {
  color: "grey.800",
  marginBottom: "-2px",
  backgroundColor: "grey.200",
  // border
  border: "none",
  borderBottom: "2px solid",
  borderBottomColor: "grey.600",
  borderRadius: "4px 0 0 0",
  fontSize: "epsilon",
  _focus: {
    borderBottomColor: "grey.600",
    outline: "none",
  },
  _focusVisible: {
    borderBottomColor: "grey.600",
    boxShadow: "none",
  },
  _invalid: {
    boxShadow: "none",
    outlineColor: "error",
  },
  _hover: {
    borderBottomColor: "grey.600",
  },
};

export const Input = {
  parts: ["field"],
  variants: {
    search: {
      field: {
        ...baseStyle,
        borderBottomColor: "bluefrance",
      },
    },
    outline: {
      field: baseStyle,
    },
  },
  defaultProps: {
    variant: "outline",
  },
};
