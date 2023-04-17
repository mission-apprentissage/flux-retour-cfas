import { Meta, StoryObj } from "@storybook/react";
import { Text } from "@chakra-ui/react";

import Component from "../../modules/mon-espace/effectifs/TeleversementInProgress";

const meta: Meta<typeof Component> = {
  title: "Modules / Effectifs / Televersements En cours",
  component: Component,
  parameters: {},
};

type Story = StoryObj<typeof Component>;

export const Simple: Story = {
  parameters: {},
};

export const AvecProgression: Story = {
  args: { message: "Import en cours: 1 sur 100 effectifs" },
  parameters: {},
};

export const AvecProgressionEtMessageCustom: Story = {
  args: {
    message: "Import en cours: 1 sur 100 effectifs",
    children: (
      <>
        <Text fontSize="1rem">Veuillez patienter pendant l&rsquo;importation de votre fichier.</Text>
        <Text fontSize="1rem">
          Une fois cette opération terminée vous serez redirigé automatiquement sur votre tableau d&rsquo;effectif.
        </Text>
      </>
    ),
  },
  parameters: {},
};

export default meta;
