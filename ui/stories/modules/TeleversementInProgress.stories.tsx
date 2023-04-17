import React from "react";
import { Heading, Text, VStack } from "@chakra-ui/react";
import { StoryFn } from "@storybook/react";

import Component, { Props } from "../../modules/mon-espace/effectifs/TeleversementInProgress";

const story = {
  title: "Modules / Effectifs / Televersements En cours",
  component: Component,
};

const Template: StoryFn<Props> = (args) => <Component {...args} />;

export const Simple = Template.bind({});

export const AvecProgression = Template.bind({});
AvecProgression.args = {
  message: "Import en cours: 1 sur 100 effectifs",
};

export const AvecProgressionEtMessageCustom = Template.bind({});
AvecProgressionEtMessageCustom.args = {
  message: "Import en cours: 1 sur 100 effectifs",
  children: (
    <>
      <Text fontSize="1rem">Veuillez patienter pendant l&rsquo;importation de votre fichier.</Text>
      <Text fontSize="1rem">
        Une fois cette opération terminée vous serez redirigé automatiquement sur votre tableau d&rsquo;effectif.
      </Text>
    </>
  ),
};

export default story;
