import { Meta, StoryObj } from "@storybook/react";

import Component from "@/modules/mon-espace/effectifs/ConfigurationAPI";

const meta: Meta<typeof Component> = {
  title: "Modules / Effectifs / Configuration API",
  component: Component,
  parameters: {},
};

type Story = StoryObj<typeof Component>;

export const MonOrganisme: Story = { args: { isMine: true, erpIdSelected: "GESTI" } };

export const UnAutreOrganisme: Story = { args: { isMine: false, erpIdSelected: "YMAG" } };

export default meta;
