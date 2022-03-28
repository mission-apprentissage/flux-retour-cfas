import { Box, Flex } from "@chakra-ui/react";
import React from "react";

import { hasUserRoles, roles } from "../../../../../../common/auth/roles";
import { Section } from "../../../../../../common/components";
import useAuth from "../../../../../../common/hooks/useAuth";
import { infosCfaPropType } from "../../propTypes";
import CopyCfaPrivateLinkButton from "./CopyCfaPrivateLinkButton";
import SousEtablissementSelection from "./SousEtablissementSelection";

const ActionsSection = ({ infosCfa }) => {
  const [auth] = useAuth();
  const isAdmin = hasUserRoles(auth, roles.administrator);

  return (
    <Section>
      <Flex justifyContent="space-between">
        {infosCfa?.sousEtablissements.length > 1 && (
          <SousEtablissementSelection sousEtablissements={infosCfa.sousEtablissements} />
        )}
        {isAdmin && infosCfa?.url_tdb && (
          <Box justifySelf="flex-end">
            <CopyCfaPrivateLinkButton link={infosCfa?.url_tdb} />
          </Box>
        )}
      </Flex>
    </Section>
  );
};

ActionsSection.propTypes = {
  infosCfa: infosCfaPropType,
};

export default ActionsSection;
