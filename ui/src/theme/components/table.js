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
            backgroundColor: "#F8F8F8",
          },
          _hover: {
            backgroundColor: "bluefrance",
            color: "white",
            cursor: "pointer",
          },
        },
      },
    },
  },
};
