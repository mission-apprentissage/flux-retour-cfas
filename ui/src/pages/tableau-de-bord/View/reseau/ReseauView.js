import { Heading } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { Highlight } from "../../../../common/components";
import { filtersPropTypes } from "../../FiltersContext";
import { effectifsPropType } from "../../propTypes";
import EffectifsSection from "../generic/EffectifsSection";
import RepartitionEffectifsReseau from "./repartition/RepartitionEffectifsReseau";

const ReseauView = ({ reseau, effectifs, filters, loading }) => {
  return (
    <>
      <Highlight>
        <Heading color="white" fontSize="gamma" marginTop="1w">
          Réseau {reseau}
        </Heading>
      </Highlight>
      {effectifs && <EffectifsSection effectifs={effectifs} loading={loading} />}
      <RepartitionEffectifsReseau filters={filters} />
    </>
  );
};

ReseauView.propTypes = {
  effectifs: effectifsPropType,
  loading: PropTypes.bool.isRequired,
  filters: filtersPropTypes.state,
  reseau: PropTypes.string.isRequired,
};

export default ReseauView;
