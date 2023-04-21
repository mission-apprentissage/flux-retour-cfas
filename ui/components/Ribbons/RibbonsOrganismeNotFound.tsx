import { Box, Text } from "@chakra-ui/react";

import Ribbons from "./Ribbons";

const RibbonsOrganismeNotFound = (props) => (
  <Ribbons variant="warning" {...props}>
    <Box ml={3}>
      <Text color="grey.800" fontSize="1.1rem" fontWeight="bold">
        Organisme introuvable
      </Text>
      <Text color="grey.800" fontSize="0.9rem">
        Merci de vérifier l&rsquo;URL de la page, et le cas échéant de contacter le support.
      </Text>
    </Box>
  </Ribbons>
);

export default RibbonsOrganismeNotFound;
