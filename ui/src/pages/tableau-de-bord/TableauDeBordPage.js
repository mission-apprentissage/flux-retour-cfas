import React from "react";

import { Alert, Page, Section } from "../../common/components";
import { FiltersProvider } from "./FiltersContext";
import IndicesHeader from "./IndicesHeader";
import useEffectifs from "./useEffectifs";
import View from "./View";

const TableauDeBordPage = () => {
  const [effectifs, loading, error] = useEffectifs();

  return (
    <Page>
      <IndicesHeader />
      <Section paddingY="2w">
        <Alert>
          La collecte des effectifs 2021-2022 est en cours ce qui peut expliquer pour certains organismes des
          informations incomplètes. Les chiffres seront disponibles progressivement d’ici début septembre. Nous vous
          remercions de votre compréhension.
        </Alert>
      </Section>
      <View effectifs={effectifs} loading={loading} error={error} />
    </Page>
  );
};

const TableauDeBordPageContainer = () => {
  return (
    <FiltersProvider>
      <TableauDeBordPage />
    </FiltersProvider>
  );
};

export default TableauDeBordPageContainer;
