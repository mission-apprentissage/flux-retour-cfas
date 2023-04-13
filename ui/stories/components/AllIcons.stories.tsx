import { Grid, Text, VStack } from "@chakra-ui/react";
import React from "react";
import * as AllIcons from "../../theme/components/icons/index";

// Composant inspiré de Chakra UI
// voir https://github.com/chakra-ui/chakra-ui/blob/bea57af3fc039fce0d1b9ac272cdd65c21fd98e1/packages/components/icons/stories/icons.stories.tsx

const lightGray = "#e9e9e9";

const Template = () => (
  <Grid gap="8" gridTemplateColumns="repeat(auto-fill, minmax(8rem, 1fr))" bg={lightGray}>
    {Object.entries(AllIcons).map(([key, IconComponent]) => {
      // const IconComponent = value as React.FC<IconProps>

      return (
        <React.Fragment key={key}>
          <VStack spacing="3">
            <IconComponent boxSize="40px" />
            <Text>{key}</Text>
          </VStack>
        </React.Fragment>
      );
    })}
  </Grid>
);

const Story = {
  title: "Components / Liste des icones",
  component: Template,
};

export const Simple = Template.bind({});

export default Story;
