import { Heading } from "@chakra-ui/layout";
import PropTypes from "prop-types";
import React from "react";

import Page from "@/components/Page/Page";
import Section from "@/components/Section/Section";
import useEffectifs from "@/hooks/useEffectifs";
import useFetchCfaInfo from "@/hooks/useFetchCfaInfo";
import { useFiltersContext } from "../FiltersContext";
import {
  CfaInformationSection,
  IndicateursAndRepartionCfaNiveauAnneesSection,
  MultiSiretDetailInformationSection,
  RepartitionEffectifsParSiretSection,
} from "../par-organisme/sections";

const CfaPrivateView = ({ cfaUai }) => {
  const [effectifs, effectifsLoading] = useEffectifs();
  const { data: infosCfa, loading: infosCfaLoading, error: infosCfaError } = useFetchCfaInfo(cfaUai);
  const { state: filters } = useFiltersContext();
  const hasMultipleSirets = infosCfa?.sousEtablissements?.length > 1;
  const sirets = infosCfa?.sousEtablissements?.map((item) => item.siret_etablissement);
  const displaySousEtablissementDetail = filters?.sousEtablissement !== null;

  return (
    <Page>
      <Section withShadow backgroundColor="galt" paddingY="4w">
        <Heading as="h1" variant="h1" marginBottom="1w">
          Visualiser les indices en temps réel
        </Heading>
      </Section>
      <CfaInformationSection infosCfa={infosCfa} loading={infosCfaLoading} error={infosCfaError} />

      {/* Filtre sur le siret pour la vue détail d'un sous établissement rattaché à un établissement avec plusieurs sirets */}
      {displaySousEtablissementDetail && <MultiSiretDetailInformationSection sirets={sirets} />}

      {/* Répartition par Siret pour un établissement multi-siret */}
      {!displaySousEtablissementDetail && hasMultipleSirets && (
        <RepartitionEffectifsParSiretSection namedDataDownloadMode={true} filters={filters} />
      )}

      {/* Vue Globale & Repartition pour un établissement sans sirets multiple ou dans la vue détail d'un sous établissement */}
      {(displaySousEtablissementDetail || !hasMultipleSirets) && (
        <IndicateursAndRepartionCfaNiveauAnneesSection
          filters={filters}
          effectifs={effectifs}
          loading={effectifsLoading}
          hasMultipleSirets={hasMultipleSirets}
          namedDataDownloadMode={true}
        />
      )}
    </Page>
  );
};

CfaPrivateView.propTypes = {
  cfaUai: PropTypes.string.isRequired,
};

export default CfaPrivateView;
