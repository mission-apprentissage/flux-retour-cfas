import { Box, Center, Flex, Spinner, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import useDownloadClick from "../../hooks/useDownloadClick";

const DownloadBlock = ({ title, description, fileName, getFile }) => {
  const [onClick, isLoading] = useDownloadClick(getFile, fileName);

  return (
    <Box
      background="white"
      fontSize="gamma"
      width="100%"
      padding="4w"
      border="1px solid"
      borderColor="#E5E5E5"
      fontWeight="bold"
    >
      {isLoading ? (
        <Center>
          <Spinner thickness="4px" speed="0.65s" emptyColor="gray.200" color="blue.500" size="xl" />
        </Center>
      ) : (
        <Box onClick={onClick} cursor="pointer">
          <Text color="black" marginBottom="2w">
            {title}
          </Text>
          <Text color="#3A3A3A" fontWeight="400" marginBottom="2w" fontSize="zeta">
            {description}
          </Text>
          <Flex justifyContent="flex-end">
            <Box as="i" className="ri-download-line" fontWeight="400" color="bluefrance" />
          </Flex>
        </Box>
      )}
    </Box>
  );
};

DownloadBlock.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  fileName: PropTypes.string.isRequired,
  getFile: PropTypes.func.isRequired,
};

export default DownloadBlock;
