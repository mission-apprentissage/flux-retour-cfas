import { Flex, Link } from "@chakra-ui/react";
import React from "react";

import { Page, Section } from "../../common/components";
import LoggedUserMenu from "../../common/components/LoggedUserMenu";
import { FiltersProvider } from "./FiltersContext";
import IndicesHeader from "./IndicesHeader";
import useEffectifs from "./useEffectifs";
import View from "./View";

const TableauDeBordPage = () => {
  const [effectifs, loading, error] = useEffectifs();

  return (
    <Page>
      <NavBar />
      <IndicesHeader />
      <View effectifs={effectifs} loading={loading} error={error} />
    </Page>
  );
};

const NavBar = () => {
  return (
    <Section paddingTop="3w">
      <Flex marginX="auto" width="100%" maxWidth="1440px" justifyContent="space-between" alignItems="center">
        <Link fontSize="zeta" paddingBottom="3w" borderBottom="solid 2px" borderBottomColor="bluefrance">
          Indices en temps réel
        </Link>
        <LoggedUserMenu />
      </Flex>
    </Section>
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
