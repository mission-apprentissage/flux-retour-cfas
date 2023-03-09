import React from "react";

import Page from "../../../pages/auth/mot-de-passe-oublie.jsx";

const Story = {
  title: "Pages / auth / mot-de-passe-oublie",
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
