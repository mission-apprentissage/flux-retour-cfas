import React from "react";
import { Box, Heading } from "@chakra-ui/react";
import { useEspace } from "../../../hooks/useEspace";
import { hasContextAccessTo } from "../../../common/utils/rolesUtils";
import OrganismeContributors from "./OrganismeContributors";

const ParametresOrganisme = ({ organisme }) => {
  const { isMonOrganismePages, isOrganismePages } = useEspace();
  return (
    <>
      <Heading textStyle="h2" color="grey.800" mt={5}>
        {isMonOrganismePages && "Paramètres de mon organisme"}
        {isOrganismePages && "Paramètres de son organisme"}
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
