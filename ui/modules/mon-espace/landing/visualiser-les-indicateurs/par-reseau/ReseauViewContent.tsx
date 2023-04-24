import PropTypes from "prop-types";
import React from "react";

import useEffectifs from "@/hooks/useEffectifs";

import { useFiltersContext } from "../FiltersContext";

import IndicateursAndRepartitionEffectifsReseau from "./IndicateursAndRepartitionEffectifsReseau";
import ReseauUpdateContactSection from "./ReseauUpdateContactSection";

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
