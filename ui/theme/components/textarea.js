const Textarea = {
  variants: {
    outline: {
      borderBottomRadius: 0,
      borderWidth: 0,
      borderBottom: "2px solid",
      marginBottom: "-2px",
      borderBottomColor: "grey.600",
      bg: "grey.200",
      borderTopRadius: "4px",
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
        outline: "2px solid",
        outlineColor: "error",
        outlineOffset: "2px",
      },
      _hover: {
        borderBottomColor: "grey.600",
      },
    },
  },
};

export { Textarea };
