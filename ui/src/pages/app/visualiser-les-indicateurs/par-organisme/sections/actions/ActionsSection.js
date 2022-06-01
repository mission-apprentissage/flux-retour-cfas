import { Flex } from "@chakra-ui/react";
import React from "react";

import { hasUserRoles, roles } from "../../../../../../common/auth/roles";
import { Section } from "../../../../../../common/components";
import useAuth from "../../../../../../common/hooks/useAuth";
import { infosCfaPropType } from "../../propTypes";
import CopyCfaPrivateLinkButton from "./CopyCfaPrivateLinkButton";

const ActionsSection = ({ infosCfa }) => {
  const [auth] = useAuth();
  const isAdmin = hasUserRoles(auth, roles.administrator);

  return (
    <Section marginTop="2w">
      <Flex justifyContent="right">
        {infosCfa?.url_tdb && isAdmin && <CopyCfaPrivateLinkButton link={infosCfa?.url_tdb} />}
      </Flex>
    </Section>
  );
};

ActionsSection.propTypes = {
  infosCfa: infosCfaPropType,
};

export default ActionsSection;
