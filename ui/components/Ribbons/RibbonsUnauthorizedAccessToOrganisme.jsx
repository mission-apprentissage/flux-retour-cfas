import { Box, Text } from "@chakra-ui/react";
import Ribbons from "./Ribbons";

const RibbonsUnauthorizedAccessToOrganisme = (props) => (
  <Ribbons variant="warning" {...props}>
    <Box ml={3}>
      <Text color="grey.800" fontSize="1.1rem" fontWeight="bold">
        Organisme introuvable
      </Text>
      <Text color="grey.800" fontSize="0.9rem">
        Veuillez vous rapprocher d&rsquo;un collaborateur qui aurait des droits de gestion ou d&rsquo;écriture dans cet
        organisme
      </Text>
    </Box>
  </Ribbons>
);

export default RibbonsUnauthorizedAccessToOrganisme;
