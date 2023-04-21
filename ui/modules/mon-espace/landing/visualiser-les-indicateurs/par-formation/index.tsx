import React from "react";

import IndicateursVueFormationPage from "./IndicateursVueFormationPage";

import { FiltersProvider } from "@/modules/mon-espace/landing/visualiser-les-indicateurs/FiltersContext";

const IndicateursVueFormationPageContainer = () => {
  return (
    <FiltersProvider>
      <IndicateursVueFormationPage />
    </FiltersProvider>
  );
};

export default IndicateursVueFormationPageContainer;
