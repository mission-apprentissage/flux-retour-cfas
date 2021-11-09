import { Heading } from "@chakra-ui/layout";
import PropTypes from "prop-types";
import React from "react";

import { Page, Section } from "../../../../common/components";
import { useFiltersContext } from "../../FiltersContext";
import { EffectifsSection } from "../../sections";
import useEffectifs from "../../useEffectifs";
import CfaSection from "../CfaView/InfosCfa/CfaSection";
import RepartionCfaNiveauAnneesSection from "../CfaView/RepartionCfaNiveauAnneesSection";

const CfaWithoutNetworkView = ({ cfaUai }) => {
  const [effectifs, loading] = useEffectifs();
  const { state: filters } = useFiltersContext();

  return (
    <Page>
      <Section backgroundColor="galt" paddingY="4w" boxShadow="inset 0px 12px 12px 0px rgba(30, 30, 30, 0.06)">
        <Heading as="h1" variant="h1" marginBottom="1w">
          Visualiser les indices en temps réel
        </Heading>
      </Section>
      {cfaUai && <CfaSection filters={filters} cfaUai={cfaUai} />}
      {effectifs && <EffectifsSection effectifs={effectifs} loading={loading} />}
      <RepartionCfaNiveauAnneesSection filters={filters} />
    </Page>
  );
};

CfaWithoutNetworkView.propTypes = {
  cfaUai: PropTypes.string.isRequired,
};

export default CfaWithoutNetworkView;
