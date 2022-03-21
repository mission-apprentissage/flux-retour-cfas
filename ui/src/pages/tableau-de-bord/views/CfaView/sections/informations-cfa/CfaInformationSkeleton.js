import { HStack, Skeleton } from "@chakra-ui/react";
import React from "react";

import { Section } from "../../../../../../common/components";

const CfaInformationSkeleton = () => {
  return (
    <Section borderTop="solid 1px" borderTopColor="grey.300" backgroundColor="galt" paddingY="2w">
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
    </Section>
  );
};

export default CfaInformationSkeleton;
