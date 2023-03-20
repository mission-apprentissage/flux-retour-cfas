import { HStack } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import LinkCard from "@/components/LinkCard/LinkCard";
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
  const { auth, organisationType } = useAuth();
  const userViewOptions =
    organisationType === "TETE_DE_RESEAU"
      ? [
          {
            path: "/par-reseau",
            title: `Vue du réseau ${auth.reseau}`,
          },
          {
            path: "/par-organisme",
            title: "Vue par organisme de formation du réseau",
          },
        ]
      : [
          {
            title: "Vue territoriale",
            path: "/par-territoire",
          },
          {
            title: "Vue par réseau",
            path: "/par-reseau",
          },
          {
            title: "Vue par organisme de formation",
            path: "/par-organisme",
          },
          {
            title: "Vue par formation",
            path: "/par-formation",
          },
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
