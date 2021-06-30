import { Heading } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { Highlight } from "../../../../common/components";
import { filtersPropTypes } from "../../FiltersContext";
import { effectifsPropType } from "../../propTypes";
import EffectifsSection from "../generic/EffectifsSection";
import RepartitionEffectifsReseau from "./repartition/RepartitionEffectifsReseau";

const ReseauView = ({ reseau, effectifs, filters }) => {
  return (
    <>
      <Highlight>
        <Heading color="white" fontSize="gamma" marginTop="1w">
          Réseau {reseau}
        </Heading>
      </Highlight>
      {effectifs && <EffectifsSection effectifs={effectifs} />}
      <RepartitionEffectifsReseau filters={filters} />
    </>
  );
};

ReseauView.propTypes = {
  effectifs: effectifsPropType,
  filters: filtersPropTypes.state,
  reseau: PropTypes.string.isRequired,
};

export default ReseauView;
