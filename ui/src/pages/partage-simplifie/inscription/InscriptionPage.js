import { Stack } from "@chakra-ui/react";
import React from "react";
import { Redirect } from "react-router-dom";

import { DownloadExplanationFile, PagePartageSimplifie, ProductHeader, Section } from "../../../common/components";
import { NAVIGATION_PAGES_PARTAGE_SIMPLIFIE } from "../../../common/constants/navigationPagesPartageSimplifie.js";
import { SESSION_STORAGE_ORGANISME } from "../../../common/constants/sessionStorageConstants.js";
import InscriptionFormBlock from "./inscription-form/InscriptionFormBlock.js";

const InscriptionPage = () => {
  if (!sessionStorage.getItem(SESSION_STORAGE_ORGANISME))
    return <Redirect to={NAVIGATION_PAGES_PARTAGE_SIMPLIFIE.Accueil.path} />;
  const organisme = JSON.parse(sessionStorage.getItem(SESSION_STORAGE_ORGANISME)) || null;

  return (
    <PagePartageSimplifie>
      <Section withShadow paddingY="4w" color="grey.800">
        <Stack spacing="4w">
          <ProductHeader />
          <InscriptionFormBlock organisme={organisme} />
          <DownloadExplanationFile />
        </Stack>
      </Section>
    </PagePartageSimplifie>
  );
};

export default InscriptionPage;
