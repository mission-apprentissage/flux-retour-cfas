const baseStyle = {
  color: "grey.800",
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

export const Select = {
  parts: ["field"],
  variants: {
    outline: {
      field: baseStyle,
    },
  },
  defaultProps: {
    variant: "outline",
  },
};
