const commonStatusBadgeStyle = {
  fontSize: "omega",
  fontWeight: 500,
  borderRadius: 20,
  px: 3,
  py: 1,
  textTransform: "none",
};

const Badge = {
  variants: {
    purple: {
      ...commonStatusBadgeStyle,
      bg: "#E3E3FD",
      color: "bluefrance",
    },
    grey: {
      ...commonStatusBadgeStyle,
      bg: "#EEEEEE",
      color: "#161616",
      pl: "15px",
      pr: "15px",
      fontWeight: "500",
    },
  },
};

export { Badge };
