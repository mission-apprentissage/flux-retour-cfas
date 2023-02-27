import React from "react";

import Page from "../../../pages/auth/inscription/index";

const Story = {
  title: "Pages / auth / inscription",
  component: Page,
};

const Template = (args) => <Page {...args} />;

export const Inscription = Template.bind({});
Inscription.storyName = "Processus d'inscription";
Inscription.parameters = {
  mockAuth: {
    isInPendingValidation: true,
    account_status: "FORCE_COMPLETE_PROFILE_STEP1",
    roles: ["of"],
  },
};

export default Story;
