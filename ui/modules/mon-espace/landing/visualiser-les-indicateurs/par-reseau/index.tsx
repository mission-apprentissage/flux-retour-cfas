import React from "react";

import { FiltersProvider } from "../FiltersContext";

import IndicateursVueReseauPage from "./IndicateursVueReseauPage";

const IndicateursVueReseauPageContainer = () => {
  return (
    <FiltersProvider>
      <IndicateursVueReseauPage />
    </FiltersProvider>
  );
};

export default IndicateursVueReseauPageContainer;
