import React from "react";

import { FiltersProvider } from "../../../../components/_pagesComponents/FiltersContext.js";
import IndicateursVueTerritoirePage from "./IndicateursVueTerritoirePage";

const IndicateursVueTerritoirePageContainer = () => {
  return (
    <FiltersProvider>
      <IndicateursVueTerritoirePage />
    </FiltersProvider>
  );
};

export default IndicateursVueTerritoirePageContainer;
