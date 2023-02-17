import { Skeleton } from "@chakra-ui/react";
import React from "react";

import Section from "@/components/Section/Section";

const CfaInformationSkeleton = () => {
  return (
    <Section borderTop="solid 1px" borderTopColor="grey.300" backgroundColor="galt" paddingY="2w">
      <Skeleton height="2rem" width="250px" marginBottom="2w" />
      <Skeleton height="3rem" width="100%" />
    </Section>
  );
};

export default CfaInformationSkeleton;
