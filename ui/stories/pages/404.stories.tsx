import { Meta, StoryObj } from "@storybook/react";

import Page from "../../pages/404";

const meta: Meta<typeof Page> = {
  title: "Pages / 404",
  component: Page,
  parameters: {},
};

type Story = StoryObj<typeof Page>;

export const Default: Story = {
  parameters: {},
};

export default meta;
