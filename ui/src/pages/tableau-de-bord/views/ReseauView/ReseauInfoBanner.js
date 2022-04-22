import { Badge, Flex, HStack, Link, Spacer, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { hasUserRoles, roles } from "../../../../common/auth/roles";
import { Section } from "../../../../common/components";
import { CONTACT_ADDRESS } from "../../../../common/constants/product";
import useAuth from "../../../../common/hooks/useAuth";

const ReseauInfoBanner = ({ nomReseau }) => {
  const [auth] = useAuth();
  const hasUserNetworkRole = auth?.sub && hasUserRoles(auth, [roles.network]);

  return (
    <Section borderTop="solid 1px" borderTopColor="grey.300" backgroundColor="galt" paddingY="2w">
      <Flex fontSize="epsilon" textColor="grey.800">
        <HStack>
          <Text marginBottom="2px" marginRight="1px">
            Réseau :
          </Text>
          <Badge fontSize="epsilon" textColor="grey.800" paddingX="1v" paddingY="2px" backgroundColor="#ECEAE3">
            {nomReseau}
          </Badge>
        </HStack>
        {hasUserNetworkRole === true && (
          <>
            <Spacer />
            <Text marginRight="2px">
              Pour apporter des modifications à votre réseau,{" "}
              <Link href={`mailto:${CONTACT_ADDRESS}`} color="bluefrance" whiteSpace="nowrap">
                contactez-nous.
              </Link>
            </Text>
          </>
        )}
      </Flex>
    </Section>
  );
};

ReseauInfoBanner.propTypes = {
  nomReseau: PropTypes.string.isRequired,
};

export default ReseauInfoBanner;
