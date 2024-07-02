const Tag = {
  variants: {
    text: (props) => {
      const { colorScheme } = props;
      return {
        container: {
          border: 0,
          color: `${colorScheme}.800`,
          bg: "transparent",
          fontWeight: "normal",
          fontSize: "zeta",
        },
      };
    },
    badge: (props) => {
      const { colorScheme } = props;
      return {
        container: {
          bg: `${colorScheme}.100`,
          color: `${colorScheme}.800`,
          fontWeight: "bold",
          fontSize: "zeta",
        },
      };
    },
  },
};

export { Tag };
