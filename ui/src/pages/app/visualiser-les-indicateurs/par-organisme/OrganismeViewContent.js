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
  RepartitionEffectifsParSiretSection,
  RepartitionSection,
} from "./sections";

const OrganismeViewContent = ({ cfaUai, filters }) => {
  const [effectifs, effectifsLoading] = useEffectifs();
  const { data: infosCfa, loading: infosCfaLoading, error: infosCfaError } = useFetchCfaInfo(cfaUai);
  const [auth] = useAuth();
  const isAdmin = hasUserRoles(auth, roles.administrator);
  const hasMultipleSirets = infosCfa?.sousEtablissements?.length > 1;

  return (
    <>
      <CfaInformationSection infosCfa={infosCfa} loading={infosCfaLoading} error={infosCfaError} />
      {infosCfa && <ActionsSection infosCfa={infosCfa} />}
      {hasMultipleSirets && <RepartitionEffectifsParSiretSection filters={filters} />}
      {!hasMultipleSirets && (
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
