import { Heading } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { Highlight, Page } from "../../../../common/components";
import { filtersPropTypes } from "../../FiltersContext";
import { effectifsPropType } from "../../propTypes";
import { EffectifsSection, IndicesHeaderSection, ProvenanceIndicesSection } from "../../sections";
import RepartitionEffectifsReseau from "./RepartitionEffectifsReseau";

const ReseauView = ({ reseau, effectifs, filters, loading }) => {
  return (
    <Page>
      <IndicesHeaderSection />
      <Highlight>
        <Heading color="white" fontSize="gamma" marginTop="1w">
          Réseau {reseau}
        </Heading>
      </Highlight>
      <ProvenanceIndicesSection />
      <EffectifsSection effectifs={effectifs} loading={loading} />
      <RepartitionEffectifsReseau filters={filters} />
    </Page>
  );
};

ReseauView.propTypes = {
  effectifs: effectifsPropType,
  loading: PropTypes.bool.isRequired,
  filters: filtersPropTypes.state,
  reseau: PropTypes.string.isRequired,
};

export default ReseauView;
