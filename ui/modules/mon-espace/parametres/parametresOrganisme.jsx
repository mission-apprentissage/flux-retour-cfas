import React from "react";
import { Box, Heading } from "@chakra-ui/react";

import { hasContextAccessTo } from "../../../common/utils/rolesUtils";
import OrganismeContributors from "./OrganismeContributors";

const ParametresOrganisme = ({ organisme, title }) => {
  return (
    <>
      <Heading textStyle="h2" color="grey.800" mt={5}>
        {title}
      </Heading>
      <Box mt={9}>
        {hasContextAccessTo(organisme, "organisme/page_parametres/gestion_acces") && (
          <OrganismeContributors size="md" />
        )}
      </Box>
    </>
  );
};

export default ParametresOrganisme;
