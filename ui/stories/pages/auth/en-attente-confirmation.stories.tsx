import { Meta, StoryObj } from "@storybook/react";

import Page from "@/pages/auth/en-attente-confirmation";

const meta: Meta<typeof Page> = {
  title: "Pages / auth / en-attente-confirmation",
  component: Page,
};

type Story = StoryObj<typeof Page>;

export const WaitingConfirmation: Story = {
  name: "En attente de confirmation",
};

export default meta;
