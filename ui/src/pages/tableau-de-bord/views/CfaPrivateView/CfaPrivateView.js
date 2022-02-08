import { Heading } from "@chakra-ui/layout";
import PropTypes from "prop-types";
import React from "react";

import { Page, Section } from "../../../../common/components";
import { useFiltersContext } from "../../FiltersContext";
import { VueGlobaleSection } from "../../sections";
import useEffectifs from "../../useEffectifs";
import { ActionsSection, CfaInformationSection, RepartitionSection } from "../CfaView/sections";
import withInfoCfaData from "../CfaView/withInfoCfaData";

const CfaPrivateView = ({ infosCfa, loading, error }) => {
  const [effectifs, effectifsLoading] = useEffectifs();
  const { state: filters } = useFiltersContext();

  return (
    <Page>
      <Section backgroundColor="galt" paddingY="4w" withShadow>
        <Heading as="h1" variant="h1" marginBottom="1w">
          Visualiser les indices en temps réel
        </Heading>
      </Section>
      <CfaInformationSection infosCfa={infosCfa} loading={loading} error={error} />
      {infosCfa && <ActionsSection infosCfa={infosCfa} />}
      {effectifs && <VueGlobaleSection effectifs={effectifs} loading={effectifsLoading} />}
      <RepartitionSection filters={filters} />
    </Page>
  );
};

CfaPrivateView.propTypes = {
  infosCfa: PropTypes.object,
  error: PropTypes.object,
  loading: PropTypes.bool.isRequired,
};

export default withInfoCfaData(CfaPrivateView);
