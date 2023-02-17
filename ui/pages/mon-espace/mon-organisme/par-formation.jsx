import React from "react";

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
// import DashboardContainer from "@/modules/mon-espace/landing/DashboardContainer";
import { FiltersProvider } from "@/modules/mon-espace/landing/visualiser-les-indicateurs/FiltersContext";
import IndicateursVueFormationPage from "@/modules/mon-espace/landing/visualiser-les-indicateurs/par-formation/IndicateursVueFormationPage";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const IndicateursVueFormationPageContainer = () => {
  return (
    // <DashboardContainer>
    <FiltersProvider>
      <IndicateursVueFormationPage />
    </FiltersProvider>
    // </DashboardContainer>
  );
};

export default IndicateursVueFormationPageContainer;
