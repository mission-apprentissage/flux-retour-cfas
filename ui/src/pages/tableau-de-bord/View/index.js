import PropTypes from "prop-types";
import React from "react";

import { effectifsPropType, filtersPropType } from "../propTypes";
import CfaView from "./cfa/CfaView";
import GenericView from "./generic/GenericView";

const TableauDeBordViewSwitch = ({ filters, effectifs, loading, error }) => {
  if (filters.cfa?.type === "cfa") {
    return (
      <CfaView
        cfaSiret={filters.cfa.siret_etablissement}
        filters={filters}
        effectifs={effectifs}
        loading={loading}
        error={error}
      />
    );
  }
  return <GenericView filters={filters} effectifs={effectifs} loading={loading} error={error} />;
};

TableauDeBordViewSwitch.propTypes = {
  effectifs: effectifsPropType,
  filters: filtersPropType.isRequired,
  loading: PropTypes.bool.isRequired,
  error: PropTypes.object,
};

export default TableauDeBordViewSwitch;
