import { Stack } from "@chakra-ui/react";
import React from "react";
import { Redirect } from "react-router-dom";

import { PARTAGE_SIMPLIFIE_ROLES } from "../../../common/auth/roles.js";
import { PagePartageSimplifie, ProductHeader, Section } from "../../../common/components";
import { NAVIGATION_PAGES_PARTAGE_SIMPLIFIE } from "../../../common/constants/navigationPagesPartageSimplifie.js";
import useAuth from "../../../common/hooks/useAuth.js";
import RechercherOrganismeParUai from "./identifier-organisme/RechercherOrganismeParUai.js";

const HomePagePartageSimplifie = () => {
  const { auth } = useAuth();

  if (auth?.sub && auth?.role === PARTAGE_SIMPLIFIE_ROLES.ADMINISTRATOR)
    return <Redirect to={NAVIGATION_PAGES_PARTAGE_SIMPLIFIE.GestionUtilisateurs.path} />;

  if (auth?.sub && auth?.role === PARTAGE_SIMPLIFIE_ROLES.OF)
    return <Redirect to={NAVIGATION_PAGES_PARTAGE_SIMPLIFIE.EspaceOrganisme.path} />;

  return (
    <PagePartageSimplifie>
      <Section withShadow paddingY="4w" color="grey.800">
        <Stack spacing="4w">
          <ProductHeader />
          <RechercherOrganismeParUai />
        </Stack>
      </Section>
    </PagePartageSimplifie>
  );
};

export default HomePagePartageSimplifie;
