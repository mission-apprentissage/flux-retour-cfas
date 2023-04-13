import React from "react";

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import {
  FiltersProvider,
  getDefaultState,
} from "@/modules/mon-espace/landing/visualiser-les-indicateurs/FiltersContext";
import useAuth from "@/hooks/useAuth";
import IndicateursVueReseauPage from "@/modules/mon-espace/landing/visualiser-les-indicateurs/par-reseau/IndicateursVueReseauPage";
import withAuth from "@/components/withAuth";
import { OrganisationTeteReseau } from "@/common/internal/Organisation";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const IndicateursVueReseauPageContainer = () => {
  const { auth, organisationType } = useAuth();
  if (organisationType === "TETE_DE_RESEAU") {
    const fixedFiltersState = { reseau: { nom: (auth.organisation as OrganisationTeteReseau).reseau } };
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
