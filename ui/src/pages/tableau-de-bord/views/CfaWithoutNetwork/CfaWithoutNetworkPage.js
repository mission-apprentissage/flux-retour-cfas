import { Heading } from "@chakra-ui/layout";
import PropTypes from "prop-types";
import React from "react";
import { Redirect } from "react-router";

import { Page, Section } from "../../../../common/components";
import { useFetch } from "../../../../common/hooks/useFetch";
import { FiltersProvider, getDefaultState, useFiltersContext } from "../../FiltersContext";
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

const CfaWithoutNetworkPage = ({ match }) => {
  const [data, loading, error] = useFetch(`/api/cfas/url-access-token/${match?.params.accessToken}`);

  let content = null;

  if (error) content = <Redirect to="/404"></Redirect>;

  if (data && !loading) {
    const defaultCfaState = { ...getDefaultState(), cfa: { uai_etablissement: data.uai } };
    content = (
      <FiltersProvider defaultState={defaultCfaState}>
        <CfaWithoutNetworkView cfaUai={data.uai} />
      </FiltersProvider>
    );
  }

  return <>{content}</>;
};

CfaWithoutNetworkPage.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      accessToken: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
};

export default CfaWithoutNetworkPage;
