import PropTypes from "prop-types";
import React from "react";

import { hasUserRoles, roles } from "../../../../common/auth/roles";
import { Page } from "../../../../common/components";
import useAuth from "../../../../common/hooks/useAuth";
import useFetchCfaInfo from "../../../../common/hooks/useFetchCfaInfo";
import { filtersPropTypes } from "../../FiltersContext";
import { effectifsPropType } from "../../propTypes";
import { IndicesHeaderSection, VueGlobaleSection } from "../../sections";
import { ActionsSection, CfaInformationSection, RepartitionSection } from "./sections";
import RepartitionEffectifsParSiretSection from "./sections/repartition-effectifs-par-siret/RepartitionEffectifsParSiretSection";

const CfaView = ({ cfaUai, filters, effectifs, effectifsLoading }) => {
  const { data: infosCfa, loading: infosCfaLoading, error: infosCfaError } = useFetchCfaInfo(cfaUai);
  const [auth] = useAuth();
  const isAdmin = hasUserRoles(auth, roles.administrator);
  const hasMultipleSirets = infosCfa?.sousEtablissements?.length > 1;

  return (
    <Page>
      <IndicesHeaderSection />
      <CfaInformationSection infosCfa={infosCfa} loading={infosCfaLoading} error={infosCfaError} />
      {infosCfa && <ActionsSection infosCfa={infosCfa} />}
      {hasMultipleSirets && <RepartitionEffectifsParSiretSection filters={filters} />}
      {!hasMultipleSirets && (
        <>
          <VueGlobaleSection allowDownloadDataList={isAdmin} effectifs={effectifs} loading={effectifsLoading} />
          <RepartitionSection filters={filters} />
        </>
      )}
    </Page>
  );
};

CfaView.propTypes = {
  cfaUai: PropTypes.string.isRequired,
  effectifs: effectifsPropType,
  effectifsLoading: PropTypes.bool.isRequired,
  filters: filtersPropTypes.state,
};

export default CfaView;
