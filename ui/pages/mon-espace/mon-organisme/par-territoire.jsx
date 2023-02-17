import React from "react";

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
// import DashboardContainer from "@/modules/mon-espace/landing/DashboardContainer";
import { FiltersProvider } from "@/modules/mon-espace/landing/visualiser-les-indicateurs/FiltersContext";
import IndicateursVueTerritoirePage from "@/modules/mon-espace/landing/visualiser-les-indicateurs/par-territoire/IndicateursVueTerritoirePage";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const IndicateursVueTerritoirePageContainer = () => {
  return (
    // <DashboardContainer>
    <FiltersProvider>
      <IndicateursVueTerritoirePage />
    </FiltersProvider>
    // </DashboardContainer>
  );
};

export default IndicateursVueTerritoirePageContainer;
