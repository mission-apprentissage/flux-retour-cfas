import { Meta, StoryObj } from "@storybook/react";

import Component from "@/components/AlertMessage/AlertMessage";

function getMaintenanceMessages(response) {
  return [
    {
      url: "/api/v1/maintenanceMessages",
      method: "GET",
      status: 200,
      response,
    },
  ];
}

const meta: Meta<typeof Component> = {
  title: "Components / AlertMessage",
  component: Component,
  parameters: {
    mockData: getMaintenanceMessages([]),
  },
};

type Story = StoryObj<typeof Component>;

export const AucunMessage: Story = {
  parameters: {
    mockData: getMaintenanceMessages([]),
  },
};

export const MessageAlerte: Story = {
  parameters: {
    mockData: getMaintenanceMessages([
      { _id: "1", context: "manuel", type: "alert", msg: "un exemple de message d'alerte", enabled: true },
    ]),
  },
};

export const MessageInfo: Story = {
  parameters: {
    mockData: getMaintenanceMessages([
      { _id: "1", context: "manuel", type: "info", msg: "un exemple de message d'information", enabled: true },
    ]),
  },
};

export default meta;
