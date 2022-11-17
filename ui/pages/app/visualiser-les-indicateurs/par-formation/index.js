import React from "react";

import { FiltersProvider } from "../../../../components/_pagesComponents/FiltersContext.js";
import IndicateursVueFormationPage from "./IndicateursVueFormationPage";

const IndicateursVueFormationPageContainer = () => {
  return (
    <FiltersProvider>
      <IndicateursVueFormationPage />
    </FiltersProvider>
  );
};

export default IndicateursVueFormationPageContainer;
