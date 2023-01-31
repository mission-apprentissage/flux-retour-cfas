import PropTypes from "prop-types";
import React from "react";

import useFetchIndicateurs from "../../../../hooks/old/useFetchIndicateurs.js";
import { filtersPropTypes } from "../FiltersContext";
import { infosCfaPropType } from "./propTypes";
import {
  CfaInformationSection,
  IndicateursAndRepartionCfaNiveauAnneesSection,
  MultiSiretDetailInformationSection,
  RepartitionEffectifsParSiretSection,
} from "./sections";

const OrganismeViewContent = ({ infosCfa, loading, error, filters }) => {
  const [effectifs, effectifsLoading] = useFetchIndicateurs();
  const hasMultipleSirets = infosCfa?.sousEtablissements?.length > 1;
  const sirets = infosCfa?.sousEtablissements?.map((item) => item.siret_etablissement);
  const displaySousEtablissementDetail = filters?.sousEtablissement !== null;

  return (
    <>
      <CfaInformationSection infosCfa={infosCfa} loading={loading} error={error} />

      {/* Filtre sur le SIRET pour la vue détail d'un sous établissement rattaché à un établissement avec plusieurs SIRETs */}
      {displaySousEtablissementDetail && <MultiSiretDetailInformationSection sirets={sirets} />}

      {/* Répartition par Siret pour un établissement multi-siret */}
      {!displaySousEtablissementDetail && hasMultipleSirets && (
        <RepartitionEffectifsParSiretSection filters={filters} />
      )}

      {/* Vue Globale & Repartition pour un établissement sans SIRETs multiple ou dans la vue détail d'un sous établissement */}
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
