import PropTypes from "prop-types";
import React from "react";

import { hasUserRoles, roles } from "../../../../common/auth/roles";
import useAuth from "../../../../common/hooks/useAuth";
import useEffectifs from "../../../../common/hooks/useEffectifs";
import useFetchCfaInfo from "../../../../common/hooks/useFetchCfaInfo";
import { filtersPropTypes } from "../FiltersContext";
import IndicateursGridSection from "../IndicateursGridSection";
import {
  ActionsSection,
  CfaInformationSection,
  MultiSiretDetailInformationSection,
  RepartitionEffectifsParSiretSection,
  RepartitionSection,
} from "./sections";

const OrganismeViewContent = ({ cfaUai, filters }) => {
  const [effectifs, effectifsLoading] = useEffectifs();
  const { data: infosCfa, loading: infosCfaLoading, error: infosCfaError } = useFetchCfaInfo(cfaUai);
  const [auth] = useAuth();
  const isAdmin = hasUserRoles(auth, roles.administrator);
  const hasMultipleSirets = infosCfa?.sousEtablissements?.length > 1;
  const sirets = infosCfa?.sousEtablissements?.map((item) => item.siret_etablissement);
  const displaySousEtablissementDetail = filters?.sousEtablissement !== null;

  return (
    <>
      <CfaInformationSection infosCfa={infosCfa} loading={infosCfaLoading} error={infosCfaError} />

      {/* Section de copie du lien privé */}
      {!displaySousEtablissementDetail && infosCfa && <ActionsSection infosCfa={infosCfa} />}

      {/* Filtre sur le siret pour la vue détail d'un sous établissement rattaché à un établissement avec plusieurs sirets */}
      {displaySousEtablissementDetail && <MultiSiretDetailInformationSection sirets={sirets} />}

      {/* Répartition par Siret pour un établissement multi-siret */}
      {!displaySousEtablissementDetail && hasMultipleSirets && (
        <RepartitionEffectifsParSiretSection filters={filters} />
      )}

      {/* Vue Globale & Repartition pour un établissement sans sirets multiple ou dans la vue détail d'un sous établissement */}
      {(displaySousEtablissementDetail || !hasMultipleSirets) && (
        <>
          <IndicateursGridSection allowDownloadDataList={isAdmin} effectifs={effectifs} loading={effectifsLoading} />
          <RepartitionSection filters={filters} />
        </>
      )}
    </>
  );
};

OrganismeViewContent.propTypes = {
  cfaUai: PropTypes.string.isRequired,
  filters: filtersPropTypes.state,
};

export default OrganismeViewContent;
