import PropTypes from "prop-types";
import React from "react";

import { filtersPropTypes } from "../../../../components/_pagesComponents/FiltersContext";
import { infosCfaPropType } from "../../../../components/_pagesComponents/propTypes";
import useEffectifs from "../../../../hooks/useEffectifs";
import CfaInformationSection from "./sections/informations-cfa/CfaInformationSection.jsx";
import MultiSiretDetailInformationSection from "./sections/multi-siret-detail/MultiSiretDetailInformationSection.jsx";
import IndicateursAndRepartionCfaNiveauAnneesSection from "./sections/repartition-effectifs/IndicateursAndRepartionCfaNiveauAnneesSection.jsx";
import RepartitionEffectifsParSiretSection from "./sections/repartition-effectifs-par-siret/RepartitionEffectifsParSiretSection.jsx";

const OrganismeViewContent = ({ infosCfa, loading, error, filters }) => {
  const [effectifs, effectifsLoading] = useEffectifs();
  const hasMultipleSirets = infosCfa?.sousEtablissements?.length > 1;
  const sirets = infosCfa?.sousEtablissements?.map((item) => item.siret_etablissement);
  const displaySousEtablissementDetail = filters?.sousEtablissement !== null;

  return (
    <>
      <CfaInformationSection infosCfa={infosCfa} loading={loading} error={error} />

      {/* Filtre sur le siret pour la vue détail d'un sous établissement rattaché à un établissement avec plusieurs sirets */}
      {displaySousEtablissementDetail && <MultiSiretDetailInformationSection sirets={sirets} />}

      {/* Répartition par Siret pour un établissement multi-siret */}
      {!displaySousEtablissementDetail && hasMultipleSirets && (
        <RepartitionEffectifsParSiretSection filters={filters} />
      )}

      {/* Vue Globale & Repartition pour un établissement sans sirets multiple ou dans la vue détail d'un sous établissement */}
      {(displaySousEtablissementDetail || !hasMultipleSirets) && (
        <IndicateursAndRepartionCfaNiveauAnneesSection
          filters={filters}
          effectifs={effectifs}
          loading={effectifsLoading}
          hasMultipleSirets={hasMultipleSirets}
        />
      )}
    </>
  );
};

OrganismeViewContent.propTypes = {
  infosCfa: infosCfaPropType,
  loading: PropTypes.bool,
  error: PropTypes.object,
  filters: filtersPropTypes.state,
};

export default OrganismeViewContent;
