import { Meta, StoryObj } from "@storybook/react";

import Component from "@/modules/mon-espace/effectifs/EffectifsBanner";

const meta: Meta<typeof Component> = {
  title: "Modules / Effectifs / Banniere Effectif",
  component: Component,
  args: {
    organisme: { erps: ["YMAG"] },
  },
  parameters: {},
};

type Story = StoryObj<typeof Component>;

export const MonOrganisme: Story = { args: { isMine: true } };

export const UnAutreOrganisme: Story = { args: { isMine: false } };

export default meta;
