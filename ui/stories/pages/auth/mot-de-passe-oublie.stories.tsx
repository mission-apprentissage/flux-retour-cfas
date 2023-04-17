import { Meta, StoryObj } from "@storybook/react";

import Page from "../../../pages/auth/mot-de-passe-oublie";

const meta: Meta<typeof Page> = {
  title: "Pages / auth / mot-de-passe-oublie",
  component: Page,
  parameters: {},
};

type Story = StoryObj<typeof Page>;

export const PasswordCreation: Story = {
  name: "Création du mot de passe",
  parameters: {
    mockAuth: {
      account_status: "PENDING_PASSWORD_SETUP",
    },
  },
};

export const PasswordUpdate: Story = {
  name: "MAJ du mot de passe",
  parameters: {
    mockAuth: {
      account_status: "CONFIRMED",
    },
  },
};

export default meta;
