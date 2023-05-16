import { Meta, StoryObj } from "@storybook/react";

import Component from "@/modules/mon-espace/effectifs/ChoixTransmission";

const meta: Meta<typeof Component> = {
  title: "Modules / Effectifs / Choix Transmission",
  component: Component,
  parameters: {},
};

type Story = StoryObj<typeof Component>;

export const Simple: Story = {};

export default meta;
