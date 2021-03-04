import { HStack, Skeleton } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import EffectifCard from "../../../../common/components/EffectifCard/EffectifCard";
import PageSectionTitle from "../../../../common/components/Page/PageSectionTitle";
import { STATUTS_APPRENANTS_INDICATOR_COLORS } from "../../../../common/constants/statutsColors";
import { effectifsPropType } from "../../propTypes";
import DefinitionIndicesModal from "./DefinitionIndicesModal";

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

  return (
    <>
      <PageSectionTitle>Effectifs</PageSectionTitle>
      <DefinitionIndicesModal />
      <HStack marginTop="4w">
        <EffectifCard
          count={effectifs.apprentis.count}
          evolution={effectifs.apprentis.evolution}
          label="apprentis"
          indicatorColor={STATUTS_APPRENANTS_INDICATOR_COLORS.apprentis}
        />
        <EffectifCard
          count={effectifs.inscrits.count}
          evolution={effectifs.inscrits.evolution}
          label="inscrits"
          indicatorColor={STATUTS_APPRENANTS_INDICATOR_COLORS.inscrits}
        />
        <EffectifCard
          count={effectifs.abandons.count}
          evolution={effectifs.abandons.evolution}
          label="abandons"
          indicatorColor={STATUTS_APPRENANTS_INDICATOR_COLORS.abandons}
        />
      </HStack>
    </>
  );
};

GenericView.propTypes = {
  effectifs: effectifsPropType,
  loading: PropTypes.bool.isRequired,
  error: PropTypes.object,
};

export default GenericView;
