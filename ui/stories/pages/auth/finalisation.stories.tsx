import { Meta, StoryObj } from "@storybook/react";

import { authArgTypes } from "@/.storybook/utils";
import Page from "@/pages/auth/finalisation";

const meta: Meta<typeof Page> = {
  title: "Pages / auth / finalisation",
  component: Page,
  parameters: {},
};

type Story = StoryObj<typeof Page>;

export const PageWithArgs: Story = {
  name: "Page Parametrable",
  argTypes: authArgTypes,
  args: {
    auth__roles: ["of"],
    auth__isOrganismeAdmin: false,
    auth__isInPendingValidation: true,
    auth__account_status: "PENDING_PERMISSIONS_SETUP",
    auth__organisation: "",
  },
  parameters: {},
};

export const DemandeAccesOF: Story = {
  name: "Demande d'acces OF (step1)",
  args: {},
  parameters: {
    mockAuth: {
      isInPendingValidation: true,
      account_status: "PENDING_PERMISSIONS_SETUP",
      roles: ["of"],
    },
  },
};

export const DemandeAccesOFR: Story = {
  name: "Demande d'acces OFR (step1)",
  args: {},
  parameters: {
    mockAuth: {
      isInPendingValidation: true,
      account_status: "PENDING_PERMISSIONS_SETUP",
      roles: ["reseau_of"],
    },
  },
};

export const DemandeAccesReseauPilot: Story = {
  name: "Demande d'acces reseau pilot (step1)",
  args: {},
  parameters: {
    mockAuth: {
      isInPendingValidation: true,
      account_status: "PENDING_PERMISSIONS_SETUP",
      roles: ["pilot"],
    },
  },
};

export const DemandeAccesReseauStep2: Story = {
  name: "Demande d'acces OF, OFR, pilot, ... (step2)",
  args: {},
  parameters: {
    mockAuth: {
      isInPendingValidation: true,
      account_status: "PENDING_ADMIN_VALIDATION",
      roles: ["of"],
    },
  },
};

export const DemandeAccesEnAttenteDeValidation1: Story = {
  name: "Demande d'acces en attente de validation par un admin",
  args: {},
  parameters: {
    mockAuth: {
      isInPendingValidation: false,
      isOrganismeAdmin: false,
      account_status: "PENDING_ADMIN_VALIDATION",
      roles: ["of"],
    },
  },
};

export const DemandeAccesEnAttenteDeValidation2: Story = {
  name: "Demande d'acces en attente de validation par un gestionnaire",
  args: {},
  parameters: {
    mockAuth: {
      isInPendingValidation: true,
      isOrganismeAdmin: true,
      account_status: "PENDING_ADMIN_VALIDATION",
      roles: ["of"],
    },
  },
};

export const DemandeAccesEnAttente: Story = {
  name: "Demande d'acces en attente",
  args: {},
  parameters: {
    mockAuth: {
      isInPendingValidation: true,
      roles: ["of"],
    },
  },
};

export const DemandeAccesValidee: Story = {
  name: "Demande d'acces validée",
};

export default meta;
