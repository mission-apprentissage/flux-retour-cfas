import { HStack, Skeleton } from "@chakra-ui/react";
import React from "react";

import { Highlight } from "../../../../../../common/components";

const CfaInformationSkeleton = () => {
  return (
    <Highlight>
      <Skeleton height="1rem" width="250px" marginBottom="1w" />
      <Skeleton height="2rem" width="600px" marginBottom="1w" />
      <Skeleton height="1rem" width="800px" marginBottom="1w" />
      <Skeleton height="1rem" width="150px" marginBottom="1w" />
      <HStack marginTop="1w">
        <Skeleton height="2rem" width="300px" marginBottom="1w" />
        <Skeleton height="2rem" width="300px" marginBottom="1w" />
        <Skeleton height="2rem" width="300px" marginBottom="1w" />
        <Skeleton height="2rem" width="300px" marginBottom="1w" />
      </HStack>
    </Highlight>
  );
};

export default CfaInformationSkeleton;
