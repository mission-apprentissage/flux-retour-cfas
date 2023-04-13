import React from "react";

import Page from "../../pages/404.jsx";

const Story = {
  title: "Pages / 404",
  component: Page,
};

const Template = (args) => <Page {...args} />;

export const pageNotFound = Template.bind({});

export default Story;
