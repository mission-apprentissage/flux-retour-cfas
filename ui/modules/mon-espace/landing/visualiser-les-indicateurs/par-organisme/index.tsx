import React from "react";

import { FiltersProvider } from "../FiltersContext";
import IndicateursVueOrganismePage from "./IndicateursVueOrganismePage";

const IndicateursVueOrganismePageContainer = () => {
  return (
    <FiltersProvider>
      <IndicateursVueOrganismePage />
    </FiltersProvider>
  );
};

export default IndicateursVueOrganismePageContainer;
