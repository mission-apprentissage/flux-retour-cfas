import React from "react";

import AlertMessage from "../../components/AlertMessage/AlertMessage";

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

const Story = {
  title: "Components / AlertMessage",
  component: AlertMessage,
  parameters: {
    mockData: getMaintenanceMessages([]),
  },
};

const Template = (args) => <AlertMessage {...args} />;

export const AucunMessage = Template.bind({});
AucunMessage.parameters = {
  mockData: getMaintenanceMessages([]),
};

export const MessageAlerte = Template.bind({});
MessageAlerte.parameters = {
  mockData: getMaintenanceMessages([
    { _id: "1", context: "manuel", type: "alert", msg: "un exemple de message d'alerte", enabled: true },
  ]),
};

export const MessageInfo = Template.bind({});
MessageInfo.parameters = {
  mockData: getMaintenanceMessages([
    { _id: "1", context: "manuel", type: "info", msg: "un exemple de message d'information", enabled: true },
  ]),
};

export default Story;
