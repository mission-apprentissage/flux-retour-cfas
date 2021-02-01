import React from "react";

import { Page, PageContent, PageHeader } from "../../common/components";
import Filters from "./Filters";
import EffectifsSection from "./sections/EffectifsSection";

const TableauDeBordPage = () => {
  return (
    <Page>
      <PageHeader title="Tableau de bord de l'apprentissage">
        <Filters />
      </PageHeader>
      <PageContent>
        <EffectifsSection />
      </PageContent>
    </Page>
  );
};

export default TableauDeBordPage;
