import React from "react";

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import {
  FiltersProvider,
  getDefaultState,
} from "@/modules/mon-espace/landing/visualiser-les-indicateurs/FiltersContext";
import useAuth from "@/hooks/useAuth";
import IndicateursVueReseauPage from "@/modules/mon-espace/landing/visualiser-les-indicateurs/par-reseau/IndicateursVueReseauPage";
import { roles } from "@/common/auth/roles";
import withAuth from "@/components/withAuth";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const IndicateursVueReseauPageContainer = () => {
  const [auth] = useAuth();
  if (auth?.roles?.includes(roles.network)) {
    // FIXME retrieve the user network
    const fixedFiltersState = { reseau: { nom: "[FIXME] NOM RESEAU" } };
    const defaultFiltersState = { ...getDefaultState(), ...fixedFiltersState };
    return (
      <FiltersProvider defaultState={defaultFiltersState} fixedState={fixedFiltersState}>
        <IndicateursVueReseauPage userLoggedAsReseau />
      </FiltersProvider>
    );
  }

  return (
    <FiltersProvider>
      <IndicateursVueReseauPage />
    </FiltersProvider>
  );
};

export default withAuth(IndicateursVueReseauPageContainer);
