import { Skeleton, Stack } from "@chakra-ui/react";
import React from "react";

const PageSkeleton = () => {
  return (
    <Stack spacing="2w">
      <Skeleton height="5rem" startColor="grey.600" endColor="grey.200" />
      <Skeleton height="1rem" startColor="grey.600" endColor="grey.200" />
      <Skeleton height="1rem" startColor="grey.600" endColor="grey.200" />
      <Skeleton height="5rem" startColor="grey.600" endColor="grey.200" />
      <Skeleton height="1rem" startColor="grey.600" endColor="grey.200" />;
      <Skeleton height="1rem" startColor="grey.600" endColor="grey.200" />;
    </Stack>
  );
};

export default PageSkeleton;
