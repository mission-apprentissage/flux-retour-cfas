const Tabs = {
  parts: ["tablist", "tab", "tabpanel"],
  baseStyle: {
    tablist: {
      px: [0, 24],
      border: "none",
      bg: "secondaryBackground",
      color: "grey.750",
    },
    tabpanel: {
      px: [8, 24],
      color: "grey.100",
      h: 1000,
    },
    tab: {
      color: "grey.500",
      _focus: { boxShadow: "none", outlineColor: "none" },
      _focusVisible: { boxShadow: "0 0 0 3px #2A7FFE", outlineColor: "#2A7FFE" },
    },
  },
  variants: {
    line: {
      tab: {
        fontSize: ["epsilon", "gamma"],
        _selected: { color: "grey.800", borderBottom: "4px solid", borderColor: "grey.750" },
      },
    },
    search: {
      tablist: {
        px: [0, 2],
        borderBottom: "1px solid #e7e7e7",
        bg: "secondaryBackground",
        color: "grey.750",
      },
      tabpanel: {
        px: [0, 0],
        color: "grey.800",
        h: "auto",
      },
      tab: {
        mx: [0, 1],
        bg: "#EEF1F8",
        color: "#383838",
        fontWeight: "700",
        fontSize: "zeta",
        position: "relative",
        bottom: "-1px",
        _hover: {
          bg: "#B6B6FF",
        },
        _selected: {
          bg: "white",
          color: "bluefrance",
          borderTop: "2px solid #000091",
          borderLeft: "1px solid #e7e7e7",
          borderRight: "1px solid #e7e7e7",
        },
      },
    },
  },
};

export { Tabs };
