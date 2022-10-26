import { Box, Flex, Heading, Text } from "@chakra-ui/react";

import { EXPLANATION_FILE } from "../../constants/productPartageSimplifie.js";

const DownloadExplanationFile = () => {
  return (
    <Box width="40%">
      <a target="_blank" rel="noopener noreferrer" href={EXPLANATION_FILE.PATH}>
        <Box border="1px solid" borderColor="#DDDDDD" padding="4w">
          <Heading fontSize="22px">Comprendre les données récoltées</Heading>
          <Text fontSize="zeta" color="gray.800" marginTop="2w">
            Téléchargez ce document explicatif pour comprendre les futurs champs à remplir par vos soins et les raisons
            pour lesquelles ils sont récoltés par l’équipe du Tableau de bord.
          </Text>
          <Flex marginTop="4w">
            <Text marginTop="1w" fontSize="omega" color="#666666" textDecoration="underline" flex="1">
              {EXPLANATION_FILE.EXTENSION} – {EXPLANATION_FILE.SIZE} Ko
            </Text>
            <Box as="i" color="bluefrance" fontSize="beta" className="ri-download-line" />
          </Flex>
        </Box>
      </a>
    </Box>
  );
};

export default DownloadExplanationFile;
