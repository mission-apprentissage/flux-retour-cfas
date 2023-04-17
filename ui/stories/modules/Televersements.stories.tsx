import { Meta, StoryObj } from "@storybook/react";

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

const meta: Meta<typeof Component> = {
  title: "Modules / Effectifs / Televersements",
  component: Component,
  parameters: {
    mockData: getUploads([]),
    mockRecoil: {
      organisme: { id: 1 },
      uploads: [],
    },
  },
};

type Story = StoryObj<typeof Component>;

export const Simple: Story = {
  parameters: {
    mockData: getUploads([]),
  },
};

export default meta;
