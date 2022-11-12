import { Skeleton, Stack } from "@chakra-ui/react";

const Loading = () => {
  return (
    <Stack spacing="2w" paddingLeft="1w" marginTop="2w">
      <Skeleton startColor="grey.300" endColor="grey.500" width="100%" height="1.5rem" />;
      <Skeleton startColor="grey.300" endColor="grey.500" width="100%" height="1.5rem" />;
      <Skeleton startColor="grey.300" endColor="grey.500" width="100%" height="1.5rem" />;
      <Skeleton startColor="grey.300" endColor="grey.500" width="100%" height="1.5rem" />;
      <Skeleton startColor="grey.300" endColor="grey.500" width="100%" height="1.5rem" />;
    </Stack>
  );
};

export default Loading;
