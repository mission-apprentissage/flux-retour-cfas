import { Meta, StoryObj } from "@storybook/react";

import Page from "../../../pages/auth/inscription";

const meta: Meta<typeof Page> = {
  title: "Pages / auth / inscription",
  component: Page,
};

type Story = StoryObj<typeof Page>;

export const Inscription: Story = {
  name: "Processus d'inscription",
  args: {
    primary: true,
    label: "Button",
  },
  parameters: {
    mockAuth: {
      isInPendingValidation: true,
      account_status: "PENDING_PERMISSIONS_SETUP",
      roles: ["of"],
    },
  },
};

export default meta;
