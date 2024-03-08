import { Flex, Spinner } from "@chakra-ui/react";

const LoaderFullScreen = () => (
  <Flex height="100vh" alignItems="center" justifyContent="center">
    <Spinner />
  </Flex>
);

export default LoaderFullScreen;
