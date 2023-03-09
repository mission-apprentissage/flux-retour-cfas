import React from "react";

import Page from "../../../pages/auth/modifier-mot-de-passe.jsx";

const Story = {
  title: "Pages / auth / modifier-mot-de-passe",
  component: Page,
};

const Template = (args) => <Page {...args} />;

export const PasswordCreation = Template.bind({});
PasswordCreation.storyName = "Création du mot de passe";
PasswordCreation.parameters = {
  mockAuth: {
    account_status: "PENDING_PASSWORD_SETUP",
  },
};

export const PasswordUpdate = Template.bind({});
PasswordUpdate.storyName = "MAJ du mot de passe";
PasswordUpdate.parameters = {
  mockAuth: {
    account_status: "CONFIRMED",
  },
};

export default Story;
