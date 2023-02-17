import { HStack } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { hasUserRoles, roles } from "@/common/auth/roles";
import LinkCard from "@/components/LinkCard/LinkCard";
import { NAVIGATION_PAGES } from "@/common/constants/navigationPages";
import useAuth from "@/hooks/useAuth";

const ViewOptionCard = ({ navigationPageData }) => {
  return (
    <LinkCard variant="white" linkHref={navigationPageData.path} minHeight="145px">
      {navigationPageData.title}
    </LinkCard>
  );
};

ViewOptionCard.propTypes = {
  navigationPageData: PropTypes.shape({
    path: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
  }).isRequired,
};

const ViewSelection = () => {
  const [auth] = useAuth();
  const isUserANetwork = hasUserRoles(auth, roles.network);
  const userViewOptions = isUserANetwork
    ? [
        {
          path: NAVIGATION_PAGES.VisualiserLesIndicateursParReseau.path,
          // FIXME retrieve the user network
          title: "Vue du réseau [FIXME] NOM RESEAU",
        },
        {
          path: NAVIGATION_PAGES.VisualiserLesIndicateursParOrganisme.path,
          title: "Vue par organisme de formation du réseau",
        },
      ]
    : [
        NAVIGATION_PAGES.VisualiserLesIndicateursParTerritoire,
        NAVIGATION_PAGES.VisualiserLesIndicateursParReseau,
        NAVIGATION_PAGES.VisualiserLesIndicateursParOrganisme,
        NAVIGATION_PAGES.VisualiserLesIndicateursParFormation,
      ];
  return (
    <HStack marginTop="3w" spacing="3w">
      {userViewOptions.map((navigationPageData) => {
        return <ViewOptionCard key={navigationPageData.path} navigationPageData={navigationPageData} />;
      })}
    </HStack>
  );
};

export default ViewSelection;
