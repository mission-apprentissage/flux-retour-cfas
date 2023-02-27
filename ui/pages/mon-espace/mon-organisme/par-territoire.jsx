import React from "react";

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import { FiltersProvider } from "@/modules/mon-espace/landing/visualiser-les-indicateurs/FiltersContext";
import IndicateursVueTerritoirePage from "@/modules/mon-espace/landing/visualiser-les-indicateurs/par-territoire/IndicateursVueTerritoirePage";
import withAuth from "@/components/withAuth";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const IndicateursVueTerritoirePageContainer = () => {
  return (
    <FiltersProvider>
      <IndicateursVueTerritoirePage />
    </FiltersProvider>
  );
};

export default withAuth(IndicateursVueTerritoirePageContainer);
