const Tabs = {
  defaultProps: {
    variant: "primary",
  },
  parts: ["tablist", "tab", "tabpanel"],
  variants: {
    primary: {
      tablist: {
        paddingX: 0,
        background: "transparent",
        border: "none",
        borderBottom: "1px solid",
        borderBottomColor: "grey.300",
      },
      tabpanel: {
        paddingY: "3w",
        paddingX: "0",
        h: "auto",
      },
      tab: {
        paddingX: "3w",
        paddingY: "3v",
        marginRight: "1w",
        position: "relative",
        bottom: "-1px",
        color: "grey.700",
        background: "bluesoft.100",
        fontWeight: "400",
        fontSize: "zeta",
        _hover: {
          background: "grey.100",
        },
        _selected: {
          background: "white",
          color: "bluefrance",
          borderBottom: "none",
          borderLeft: "1px solid",
          borderRight: "1px solid",
          borderTop: "2px solid",
          borderTopColor: "bluefrance",
          borderRightColor: "grey.300",
          borderLeftColor: "grey.300",
        },
        _focus: { boxShadow: "none", outlineColor: "none" },
        _focusVisible: { boxShadow: "0 0 0 3px #2A7FFE", outlineColor: "#2A7FFE" },
      },
    },
  },
};

export { Tabs };
