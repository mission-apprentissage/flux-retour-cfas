import { HStack, Skeleton } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { effectifsPropType } from "../../propTypes";
import EffectifsSection from "./EffectifsSection";

const GenericViewLoading = () => {
  return (
    <HStack>
      <Skeleton height="8rem" width="16rem" startColor="bluesoft.50" endColor="bluesoft.200" />;
      <Skeleton height="8rem" width="16rem" startColor="bluesoft.50" endColor="bluesoft.200" />;
      <Skeleton height="8rem" width="16rem" startColor="bluesoft.50" endColor="bluesoft.200" />;
    </HStack>
  );
};

const GenericView = ({ effectifs, loading }) => {
  if (loading) {
    return <GenericViewLoading />;
  }

  if (!effectifs) {
    return null;
  }

  return <EffectifsSection effectifs={effectifs} />;
};

GenericView.propTypes = {
  effectifs: effectifsPropType,
  loading: PropTypes.bool.isRequired,
  error: PropTypes.object,
};

export default GenericView;
