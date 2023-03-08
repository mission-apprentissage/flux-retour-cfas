module.exports = {
  stories: ["../stories/**/*.stories.mdx", "../stories/**/*.stories.@(js|jsx|ts|tsx)"],
  staticDirs: ["../public"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    "storybook-addon-mock",
    "storybook-addon-next",
  ],
  framework: "@storybook/react",
  core: {
    builder: "@storybook/builder-webpack5",
  },
  webpackFinal: (config) => {
    return {
      ...config,
      resolve: {
        ...config.resolve,
        fallback: {
          crypto: false,
          https: false,
          path: false,
        },
      },
    };
  },
};
