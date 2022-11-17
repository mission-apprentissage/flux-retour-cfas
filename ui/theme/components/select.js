const commonFieldStyle = {
  color: "grey.800",
  borderBottomRadius: 0,
  borderWidth: 0,
  borderBottom: "2px solid",
  marginBottom: "0",
  borderBottomColor: "grey.600",
  bg: "grey.200",
  borderTopRadius: "4px",
  outline: "0px solid",
  _focus: {
    borderBottomColor: "grey.600",
    boxShadow: "none",
    outlineColor: "none",
  },
  _focusVisible: {
    borderBottomColor: "grey.600",
    boxShadow: "none",
    outline: "2px solid",
    outlineColor: "#2A7FFE",
    outlineOffset: "2px",
  },
  _invalid: {
    borderBottomColor: "grey.600",
    boxShadow: "none",
    // outline: "2px solid",
    outlineColor: "error",
    outlineOffset: "2px",
  },
  _hover: {
    borderBottomColor: "grey.600",
  },
  _disabled: { opacity: 0.7 },
};

const Select = {
  parts: ["field"],
  variants: {
    cerfa: {
      field: {
        ...commonFieldStyle,
        _disabled: {
          cursor: "not-allowed",
          color: "grey.600",
          opacity: 1,
          borderBottomColor: "#E5E5E5",
        },
      },
    },
    edition: {
      field: {
        ...commonFieldStyle,
        fontWeight: 700,
      },
    },
    outline: {
      field: {
        ...commonFieldStyle,
      },
    },
    valid: {
      field: {
        ...commonFieldStyle,
        borderBottomColor: "green.500",
      },
    },
  },
};

export { Select };
