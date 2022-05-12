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
  },
};
