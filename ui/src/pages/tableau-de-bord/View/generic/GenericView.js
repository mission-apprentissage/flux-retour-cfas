import { HStack, Skeleton } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { effectifsPropType, filtersPropType } from "../../propTypes";
import EffectifsSection from "./EffectifsSection";
import RegionConversionSection from "./region-conversion/RegionConversionSection";

const GenericViewLoading = () => {
  return (
    <HStack>
      <Skeleton height="8rem" width="16rem" startColor="bluesoft.50" endColor="bluesoft.200" />
      <Skeleton height="8rem" width="16rem" startColor="bluesoft.50" endColor="bluesoft.200" />
      <Skeleton height="8rem" width="16rem" startColor="bluesoft.50" endColor="bluesoft.200" />
    </HStack>
  );
};

const GenericView = ({ filters, effectifs, loading }) => {
  if (loading) {
    return <GenericViewLoading />;
  }

  if (!effectifs) {
    return null;
  }

  return (
    <>
      <RegionConversionSection filters={filters} />
      <EffectifsSection effectifs={effectifs} />
    </>
  );
};

GenericView.propTypes = {
  effectifs: effectifsPropType,
  filters: filtersPropType,
  loading: PropTypes.bool.isRequired,
  error: PropTypes.object,
};

export default GenericView;
