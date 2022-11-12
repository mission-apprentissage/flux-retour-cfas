const Checkbox = {
  parts: ["container", "control", "label"],
  baseStyle: {
    control: {
      borderColor: "#161616",
      border: "1px",
      _checked: {
        background: "bluefrance",
        color: "white",
        borderColor: "#161616",
        border: "1px",
        _hover: {
          background: "bluefrance",
          borderColor: "#161616",
          border: "1px",
        },
      },
    },
  },
};

export { Checkbox };
