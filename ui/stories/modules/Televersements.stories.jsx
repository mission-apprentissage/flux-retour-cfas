import React from "react";

import Component from "../../modules/mon-espace/effectifs/Televersements";

function getUploads(response) {
  return [
    {
      url: "/api/v1/upload/get?organisme_id=1",
      method: "GET",
      status: 200,
      response,
    },
  ];
}

const Story = {
  title: "Modules / mon-espace / Televersements",
  component: Component,
  parameters: {
    mockData: getUploads([]),
    mockRecoil: {
      organisme: { id: 1 },
      uploads: [],
    },
  },
};

const Template = (args) => <Component {...args} />;

export const Simple = Template.bind({});
Simple.parameters = {
  mockData: getUploads([]),
};

export default Story;
