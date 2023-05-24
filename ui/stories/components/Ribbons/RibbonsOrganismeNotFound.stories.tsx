import { Meta, StoryObj } from "@storybook/react";

import Component from "@/components/Ribbons/RibbonsOrganismeNotFound";

const meta: Meta<typeof Component> = {
  title: "Components / Ribbons / RibbonsOrganismeNotFound",
  component: Component,
  parameters: {},
};

type Story = StoryObj<typeof Component>;

export const Simple: Story = {};

export default meta;
