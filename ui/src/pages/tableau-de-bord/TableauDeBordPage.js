import { Text } from "@chakra-ui/react";
import React from "react";

import { Page, PageContent, PageHeader } from "../../common/components";
import EnSavoirPlusModal from "./EnSavoirPlusModal";
import Filters from "./Filters";
import EffectifsSection from "./sections/EffectifsSection";

const TableauDeBordPage = () => {
  return (
    <Page>
      <PageHeader title="Tableau de bord de l'apprentissage">
        <Text color="grey.800" fontWeight="bold" textAlign="center" marginTop="1w">
          <span>Les indicies affichés concernent 858 centres de formation</span>
          &nbsp;
          <EnSavoirPlusModal />
        </Text>
        <Filters />
      </PageHeader>
      <PageContent>
        <EffectifsSection />
      </PageContent>
    </Page>
  );
};

export default TableauDeBordPage;
