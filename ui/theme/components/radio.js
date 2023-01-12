const Radio = {
  parts: ["container", "control", "label"],
  baseStyle: {
    control: {
      borderColor: "#161616",
      border: "1px",
      _checked: {
        color: "bluefrance",
        p: "1px",
        background: "white",
        borderColor: "bluefrance",
        _hover: {
          background: "white",
          borderColor: "bluefrance",
        },
      },
    },
  },
};

export { Radio };
