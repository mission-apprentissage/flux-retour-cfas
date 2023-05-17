import { Meta, StoryObj } from "@storybook/react";

import Component from "@/modules/mon-compte/ProfileInformation";

const meta: Meta<typeof Component> = {
  title: "Modules / Mon Compte / Profil",
  component: Component,
  parameters: {},
};

type Story = StoryObj<typeof Component>;

export const SansAPIKey: Story = { args: { apiKey: "52a92a9b-4945-4afa-877b-1b75fea691f8" } };

export const AvecAPIKey: Story = { args: { apiKey: null } };

export default meta;
