import React from "react";

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import { FiltersProvider } from "@/modules/mon-espace/landing/visualiser-les-indicateurs/FiltersContext";
import IndicateursVueFormationPage from "@/modules/mon-espace/landing/visualiser-les-indicateurs/par-formation/IndicateursVueFormationPage";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const IndicateursVueFormationPageContainer = () => {
  return (
    <FiltersProvider>
      <IndicateursVueFormationPage />
    </FiltersProvider>
  );
};

export default IndicateursVueFormationPageContainer;
