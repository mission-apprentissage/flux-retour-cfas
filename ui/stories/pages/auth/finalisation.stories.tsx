import React from "react";

import Page from "../../../pages/auth/finalisation";
import { authArgTypes } from "../../../.storybook/utils.js";

const Story = {
  title: "Pages / auth / finalisation",
  component: Page,
};

const Template = (args) => <Page {...args} />;

export const PageWithArgs = Template.bind({});
PageWithArgs.storyName = "Page Parametrable";
PageWithArgs.argTypes = authArgTypes;
PageWithArgs.args = {
  auth__roles: ["of"],
  auth__isOrganismeAdmin: false,
  auth__isInPendingValidation: true,
  auth__account_status: "PENDING_PERMISSIONS_SETUP",
  auth__organisation: "",
};

export const DemandeAccesOF = Template.bind({});
DemandeAccesOF.storyName = "Demande d'acces OF (step1)";
DemandeAccesOF.parameters = {
  mockAuth: {
    isInPendingValidation: true,
    account_status: "PENDING_PERMISSIONS_SETUP",
    roles: ["of"],
  },
};

export const DemandeAccesReseauOF = Template.bind({});
DemandeAccesReseauOF.storyName = "Demande d'acces OFR (step1)";
DemandeAccesReseauOF.parameters = {
  mockAuth: {
    isInPendingValidation: true,
    account_status: "PENDING_PERMISSIONS_SETUP",
    roles: ["reseau_of"],
  },
};

export const DemandeAccesReseauPilot = Template.bind({});
DemandeAccesReseauPilot.storyName = "Demande d'acces reseau pilot (step1)";
DemandeAccesReseauPilot.parameters = {
  mockAuth: {
    isInPendingValidation: true,
    account_status: "PENDING_PERMISSIONS_SETUP",
    roles: ["pilot"],
  },
};

export const DemandeAccesReseauStep2 = Template.bind({});
DemandeAccesReseauStep2.storyName = "Demande d'acces OF, OFR, pilot, ... (step2)";
DemandeAccesReseauStep2.parameters = {
  mockAuth: {
    isInPendingValidation: true,
    account_status: "PENDING_ADMIN_VALIDATION",
    roles: ["of"],
  },
};

export const DemandeAccesEnAttenteDeValidation1 = Template.bind({});
DemandeAccesEnAttenteDeValidation1.storyName = "Demande d'acces en attente de validation par un admin";
DemandeAccesEnAttenteDeValidation1.parameters = {
  mockAuth: {
    isInPendingValidation: true,
    isOrganismeAdmin: false,
    account_status: "PENDING_ADMIN_VALIDATION",
    roles: ["of"],
  },
};

export const DemandeAccesEnAttenteDeValidation2 = Template.bind({});
DemandeAccesEnAttenteDeValidation2.storyName = "Demande d'acces en attente de validation par un gestionnaire";
DemandeAccesEnAttenteDeValidation2.parameters = {
  mockAuth: {
    isInPendingValidation: true,
    isOrganismeAdmin: true,
    account_status: "PENDING_ADMIN_VALIDATION",
    roles: ["of"],
  },
};

export const DemandeAccesEnAttente = Template.bind({});
DemandeAccesEnAttente.storyName = "Demande d'acces en attente";
DemandeAccesEnAttente.parameters = {
  mockAuth: {
    isInPendingValidation: true,
    roles: ["of"],
  },
};

export const DemandeAccesValidee = Template.bind({});
DemandeAccesValidee.storyName = "Demande d'acces validée";

export default Story;
