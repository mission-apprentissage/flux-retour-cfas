import { Box } from "@chakra-ui/react";
import { Meta, StoryObj } from "@storybook/react";

import Component from "@/components/Ribbons/Ribbons";

const lorem =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";

const meta: Meta<typeof Component> = {
  title: "Components / Ribbons / Ribbons",
  component: Component,
  parameters: {},
};

type Story = StoryObj<typeof Component>;

export const InfoVariant: Story = {
  args: {
    variant: "info",
    children: <Box ml={3}>{lorem}</Box>,
  },
};
export const WarningVariant: Story = {
  args: {
    variant: "warning",
    children: <Box ml={3}>{lorem}</Box>,
  },
};
export const ErrorVariant: Story = {
  args: {
    variant: "error",
    children: <Box ml={3}>{lorem}</Box>,
  },
};
export const TextLong: Story = {
  args: {
    variant: "info",
    children: (
      <Box ml={3}>
        <p>
          {lorem} {lorem} {lorem} {lorem}
        </p>
        <p>
          {lorem} {lorem} {lorem} {lorem}
        </p>
      </Box>
    ),
  },
};
export default meta;
