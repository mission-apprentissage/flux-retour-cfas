import PropTypes from "prop-types";
import React from "react";

import { useFiltersContext } from "../FiltersContext";

import IndicateursAndRepartitionEffectifsReseau from "./IndicateursAndRepartitionEffectifsReseau";
import ReseauUpdateContactSection from "./ReseauUpdateContactSection";

import useEffectifs from "@/hooks/useEffectifs";

const ReseauViewContent = ({ userLoggedAsReseau = false }) => {
  const filtersContext = useFiltersContext();
  const [effectifs, loading] = useEffectifs();

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
