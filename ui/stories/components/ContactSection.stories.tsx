import React from "react";

import ContactSection from "../../components/ContactSection/ContactSection";

const Story = {
  title: "Components / ContactSection",
  component: ContactSection,
};

const Template = (args) => <ContactSection {...args} />;

export const Simple = Template.bind({});

export default Story;
