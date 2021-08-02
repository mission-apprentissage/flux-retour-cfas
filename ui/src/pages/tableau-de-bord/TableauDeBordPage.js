import React from "react";

import { Page } from "../../common/components";
import { FiltersProvider } from "./FiltersContext";
import IndicesHeader from "./IndicesHeader";
import useEffectifs from "./useEffectifs";
import View from "./View";

const TableauDeBordPage = () => {
  const [effectifs, loading, error] = useEffectifs();

  return (
    <Page>
      <IndicesHeader />
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
