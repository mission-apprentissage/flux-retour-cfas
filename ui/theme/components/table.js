export const Table = {
  variants: {
    primary: {
      th: {
        fontFamily: "heading",
        fontWeight: "bold",
        fontSize: "zeta",
        color: "grey.800",
        textTransform: "none",
        whiteSpace: "nowrap",
        paddingY: "2",
        paddingX: "3",
        letterSpacing: "normal",
      },
      thead: {
        tr: {
          borderBottom: "3px solid",
          borderBottomColor: "bluefrance",
        },
      },
      tbody: {
        tr: {
          fontSize: "zeta",
          color: "grey.800",
          "&:nth-of-type(even)": {
            backgroundColor: "grey.100",
          },
          _hover: {
            backgroundColor: "#E3E3FD",
          },
          "&.table-row-expanded": {
            backgroundColor: "#E3E3FD",
            _hover: {
              backgroundColor: "#E3E3FD",
            },
          },
          "&.expanded-row": {
            backgroundColor: "white",
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
    glossaire: {
      th: {
        fontFamily: "heading",
        fontWeight: "bold",
        fontSize: "zeta",
        color: "grey.800",
        textTransform: "none",
        whiteSpace: "nowrap",
        paddingY: "6",
        paddingX: "6",
        letterSpacing: "normal",
      },
      thead: {
        tr: {
          borderBottom: "3px solid",
          borderBottomColor: "bluefrance",
        },
      },
      tbody: {
        tr: {
          fontSize: "zeta",
          color: "grey.800",
          "&:nth-of-type(even)": {
            backgroundColor: "grey.100",
          },
          _hover: {
            backgroundColor: "grey.200",
          },
        },
        td: {
          paddingY: "6",
          paddingX: "6",
        },
      },
    },
    detailsHalfColumns: {
      th: {
        fontFamily: "heading",
        fontWeight: "bold",
        fontSize: "zeta",
        color: "grey.800",
        textTransform: "none",
        whiteSpace: "nowrap",
        paddingY: "2",
        paddingX: "3",
        letterSpacing: "normal",
      },
      tbody: {
        tr: {
          fontSize: "zeta",
          color: "grey.800",
          "&:nth-of-type(even)": {
            backgroundColor: "grey.100",
          },
          _hover: {
            backgroundColor: "grey.200",
          },
        },
        td: {
          width: "50%",
          paddingY: "2",
          paddingX: "3",
        },
      },
    },
  },
};
