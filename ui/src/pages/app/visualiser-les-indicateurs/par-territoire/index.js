import React from "react";

import { FiltersProvider } from "../FiltersContext";
import IndicateursVueTerritoirePage from "./IndicateursVueTerritoirePage";

const IndicateursVueTerritoirePageContainer = () => {
  return (
    <FiltersProvider>
      <IndicateursVueTerritoirePage />
    </FiltersProvider>
  );
};

export default IndicateursVueTerritoirePageContainer;
