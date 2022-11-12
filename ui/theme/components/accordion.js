const Accordion = {
  parts: ["container", "button", "panel", "icon"],
  baseStyle: {
    container: { mb: 2 },
    button: {
      height: 14,
      _focus: { boxShadow: "none", outlineColor: "none" },
      _focusVisible: { boxShadow: "0 0 0 3px #2A7FFE", outlineColor: "#2A7FFE" },
    },
  },
};

export { Accordion };
