import PropTypes from "prop-types";
import React from "react";

import { effectifsPropType, filtersPropType } from "../propTypes";
import CfaView from "./cfa/CfaView";
import FormationView from "./formation/FormationView";
import GenericView from "./generic/GenericView";
import ReseauView from "./reseau/ReseauView";

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

  if (filters.cfa?.type === "reseau") {
    return <ReseauView effectifs={effectifs} reseau={filters.cfa.nom} filters={filters} />;
  }

  if (filters.formation?.cfd) {
    return <FormationView formationCfd={filters.formation.cfd} filters={filters} effectifs={effectifs} />;
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
