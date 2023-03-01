import React from "react";

import { FiltersProvider } from "../FiltersContext";
import IndicateursVueFormationPage from "./IndicateursVueFormationPage";

const IndicateursVueFormationPageContainer = () => {
  return (
    <FiltersProvider>
      <IndicateursVueFormationPage />
    </FiltersProvider>
  );
};

export default IndicateursVueFormationPageContainer;
