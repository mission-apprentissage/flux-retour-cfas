import { Meta, StoryObj } from "@storybook/react";

import Component from "./Stepper";

const meta: Meta<typeof Component> = {
  title: "Components / Stepper",
  component: Component,
};

type Story = StoryObj<typeof Component>;

export const AucunMessage: Story = {
  args: {
    currentStep: 1,
    maxStep: 5,
    title: "Titre",
    nextTitle: "Sous-titre",
  },
};

export default meta;
