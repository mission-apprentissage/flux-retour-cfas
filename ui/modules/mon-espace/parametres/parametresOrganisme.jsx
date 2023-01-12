import React from "react";
import { Box, Flex, Heading, Text } from "@chakra-ui/react";
import { useEspace } from "../../../hooks/useEspace";
import { hasContextAccessTo } from "../../../common/utils/rolesUtils";
import { ArrowRightLine } from "../../../theme/components/icons";
import OrganismeContributors from "./OrganismeContributors";

const ParametresOrganisme = ({ organisme }) => {
  const { isMonOrganismePages, isOrganismePages } = useEspace();
  return (
    <>
      <Heading textStyle="h2" color="grey.800" mt={5}>
        {isMonOrganismePages && `Paramètres de mon organisme`}
        {isOrganismePages && `Paramètres de son organisme`}
      </Heading>
      <Box mt={9}>
        {hasContextAccessTo(organisme, "organisme/page_parametres/gestion_acces") && (
          <>
            <Heading as="h2" fontSize="1.7rem">
              <Flex>
                <Text as={"span"}>
                  <ArrowRightLine boxSize={26} />
                </Text>
                <Text as={"span"} ml={4}>
                  Partage de l'organisme
                </Text>
              </Flex>
            </Heading>

            <OrganismeContributors size="md" />
          </>
        )}
      </Box>
    </>
  );
};

export default ParametresOrganisme;
