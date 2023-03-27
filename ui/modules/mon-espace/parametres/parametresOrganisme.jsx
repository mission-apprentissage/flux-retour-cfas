import React from "react";
import { Box, Heading } from "@chakra-ui/react";

import OrganismeContributors from "./OrganismeContributors";

const ParametresOrganisme = ({ title }) => {
  return (
    <>
      <Heading textStyle="h2" color="grey.800" mt={5}>
        {title}
      </Heading>
      <Box mt={9}>
        <OrganismeContributors size="md" />
      </Box>
    </>
  );
};

export default ParametresOrganisme;
