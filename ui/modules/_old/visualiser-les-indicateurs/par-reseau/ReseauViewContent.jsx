import PropTypes from "prop-types";
import React from "react";

import useFetchIndicateurs from "../../../../hooks/old/useFetchIndicateurs.js";
import { useFiltersContext } from "../FiltersContext";
import IndicateursAndRepartitionEffectifsReseau from "./IndicateursAndRepartitionEffectifsReseau";
import ReseauUpdateContactSection from "./ReseauUpdateContactSection";

const ReseauViewContent = ({ userLoggedAsReseau = false }) => {
  const filtersContext = useFiltersContext();
  const [effectifs, loading] = useFetchIndicateurs();

  return (
    <>
      {userLoggedAsReseau && <ReseauUpdateContactSection />}
      <IndicateursAndRepartitionEffectifsReseau
        filters={filtersContext.state}
        effectifs={effectifs}
        loading={loading}
      />
    </>
  );
};

ReseauViewContent.propTypes = {
  userLoggedAsReseau: PropTypes.bool,
};

export default ReseauViewContent;
