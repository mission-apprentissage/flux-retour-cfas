const Switch = {
  parts: ["container", "track", "label", "thumb"],
  baseStyle: {
    thumb: {
      borderTop: "1px",
      borderRight: "1px",
      borderBottom: "1px",
      borderLeft: "1px",

      // border: "1px",
      borderColor: "bluefrance",
      ml: "-3px",
      mt: "-3px",

      padding: "10px",
    },
    track: {
      background: "white",
      border: "1px",
      borderColor: "bluefrance",
      _checked: {
        background: "bluefrance",
      },
    },
  },
  variants: {
    icon: {
      thumb: {
        _checked: {
          _before: {
            color: "bluefrance",
            width: "var(--slider-track-height)",
            height: "var(--slider-track-height)",
            content: '"✓"',
            position: "absolute",
            mt: "-10px",
            ml: "-5px",
            fontSize: "0.8em",
          },
        },
      },
    },
  },
};

export { Switch };
