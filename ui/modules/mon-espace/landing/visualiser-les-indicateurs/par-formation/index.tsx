import React from "react";

import { FiltersProvider } from "@/modules/mon-espace/landing/visualiser-les-indicateurs/FiltersContext";

import IndicateursVueFormationPage from "./IndicateursVueFormationPage";

const IndicateursVueFormationPageContainer = () => {
  return (
    <FiltersProvider>
      <IndicateursVueFormationPage />
    </FiltersProvider>
  );
};

export default IndicateursVueFormationPageContainer;
