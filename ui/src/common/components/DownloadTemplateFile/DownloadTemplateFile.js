import { Box, Flex, Heading, Text } from "@chakra-ui/react";

import { TEMPLATE_FILE } from "../../constants/productPartageSimplifie.js";

const DownloadTemplateFile = () => {
  return (
    <Box width="40%">
      <a target="_blank" rel="noopener noreferrer" href={TEMPLATE_FILE.PATH}>
        <Box border="1px solid" borderColor="#DDDDDD" padding="4w" marginTop="6w">
          <Heading fontSize="22px">Télécharger le document de dépôt de données</Heading>
          <Text fontSize="zeta" color="gray.800" marginTop="2w">
            Une fois téléchargé, remplissez-le en suivant les champs demandés, puis revenez sur votre compte pour le
            téléverser.
          </Text>
          <Flex marginTop="4w">
            <Text marginTop="1w" fontSize="omega" color="#666666" textDecoration="underline" flex="1">
              {TEMPLATE_FILE.EXTENSION} – {TEMPLATE_FILE.SIZE} Ko
            </Text>
            <Box as="i" color="bluefrance" fontSize="beta" className="ri-download-line" />
          </Flex>
        </Box>
      </a>
    </Box>
  );
};

export default DownloadTemplateFile;
