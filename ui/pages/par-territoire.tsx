import React from "react";

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import { FiltersProvider } from "@/modules/mon-espace/landing/visualiser-les-indicateurs/FiltersContext";
import IndicateursVueTerritoirePage from "@/modules/mon-espace/landing/visualiser-les-indicateurs/par-territoire/IndicateursVueTerritoirePage";
import withAuth from "@/components/withAuth";
import { getDefaultState } from "@/modules/mon-espace/landing/visualiser-les-indicateurs/FiltersContext";
import { DEPARTEMENTS_BY_ID, REGIONS_BY_ID } from "@/common/constants/territoiresConstants";
import useAuth from "@/hooks/useAuth";
import {
  OrganisationOperateurPublicDepartement,
  OrganisationOperateurPublicRegion,
} from "@/common/internal/Organisation";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const IndicateursVueTerritoirePageContainer = () => {
  const { auth } = useAuth();

  // filtre initial positionné sur la région / département de l'utilisateur
  const defaultState = getDefaultState();
  if ((auth.organisation as OrganisationOperateurPublicRegion).code_region) {
    defaultState.region = REGIONS_BY_ID[(auth.organisation as OrganisationOperateurPublicRegion).code_region];
  } else if ((auth.organisation as OrganisationOperateurPublicDepartement).code_departement) {
    defaultState.departement =
      DEPARTEMENTS_BY_ID[(auth.organisation as OrganisationOperateurPublicDepartement).code_departement];
  }

  return (
    <FiltersProvider defaultState={defaultState}>
      <IndicateursVueTerritoirePage />
    </FiltersProvider>
  );
};

export default withAuth(IndicateursVueTerritoirePageContainer);
