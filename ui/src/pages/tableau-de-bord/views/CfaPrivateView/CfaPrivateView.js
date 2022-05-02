import { Heading } from "@chakra-ui/layout";
import PropTypes from "prop-types";
import React from "react";

import { Page, Section } from "../../../../common/components";
import useEffectifs from "../../../../common/hooks/useEffectifs";
import useFetchCfaInfo from "../../../../common/hooks/useFetchCfaInfo";
import { useFiltersContext } from "../../../app/visualiser-les-indicateurs/FiltersContext";
import IndicateursGridSection from "../../../app/visualiser-les-indicateurs/IndicateursGridSection";
import { ActionsSection, CfaInformationSection, RepartitionSection } from "../CfaView/sections";

const CfaPrivateView = ({ cfaUai }) => {
  const [effectifs, effectifsLoading] = useEffectifs();
  const { data: infosCfa, loading: infosCfaLoading, error: infosCfaError } = useFetchCfaInfo(cfaUai);
  const { state: filters } = useFiltersContext();

  return (
    <Page>
      <Section withShadow backgroundColor="galt" paddingY="4w">
        <Heading as="h1" variant="h1" marginBottom="1w">
          Visualiser les indices en temps réel
        </Heading>
      </Section>
      <CfaInformationSection infosCfa={infosCfa} loading={infosCfaLoading} error={infosCfaError} isUserCfa={true} />
      {infosCfa && <ActionsSection infosCfa={infosCfa} />}
      {effectifs && <IndicateursGridSection allowDownloadDataListeffectifs={effectifs} loading={effectifsLoading} />}
      <RepartitionSection filters={filters} />
    </Page>
  );
};

CfaPrivateView.propTypes = {
  cfaUai: PropTypes.string.isRequired,
};

export default CfaPrivateView;
