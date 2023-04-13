import React from "react";

import Page from "../../../pages/auth/en-attente-confirmation";

const Story = {
  title: "Pages / auth / en-attente-confirmation",
  component: Page,
};

const Template = (args) => <Page {...args} />;

export const WaitingConfirmation = Template.bind({});
WaitingConfirmation.storyName = "EN attente de confirmation";

export default Story;
