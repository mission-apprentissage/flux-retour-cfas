export const Table = {
  variants: {
    primary: {
      th: {
        fontFamily: "heading",
        fontWeight: "bold",
        fontSize: "zeta",
        color: "grey.600",
        textTransform: "none",
      },
      tbody: {
        tr: {
          fontSize: "zeta",
          color: "grey.800",
          borderColor: "bluefrance",
          "&:nth-of-type(odd)": {
            backgroundColor: "grey.100",
          },
          _hover: {
            color: "bluefrance",
            backgroundColor: "grey.200",
            cursor: "pointer",
          },
        },
      },
    },
    secondary: {
      th: {
        textTransform: "initial",
        textColor: "grey.800",
        fontSize: "zeta",
        fontWeight: "700",
        paddingY: "3w",
        letterSpacing: "0px",
        borderBottom: "2px solid",
        borderBottomColor: "bluefrance",
      },
      tbody: {
        tr: {
          fontSize: "zeta",
          color: "grey.800",
          borderColor: "bluefrance",
          _hover: {
            color: "bluefrance",
            backgroundColor: "grey.200",
            cursor: "pointer",
          },
        },
      },
    },
  },
};
