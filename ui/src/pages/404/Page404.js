import { Heading, Link, Text } from "@chakra-ui/react";
import React from "react";

import { BreadcrumbNav, Page, Section } from "../../common/components";
import { NAVIGATION_PAGES } from "../../common/constants/navigationPages";

const Page404 = () => {
  return (
    <Page>
      <Section withShadow backgroundColor="galt" paddingY="2w" color="grey.800">
        <BreadcrumbNav links={[NAVIGATION_PAGES.Accueil, NAVIGATION_PAGES.NotFound404]} />
        <Heading as="h1" variant="h1" marginTop="1w">
          {NAVIGATION_PAGES.NotFound404.title}
        </Heading>
      </Section>
      <Section paddingY="4w">
        <Text color="grey.800" marginBottom="2w">
          La page que vous recherchez n&apos;a pas été trouvée.
        </Text>
        <Link href={NAVIGATION_PAGES.Accueil.path} color="bluefrance">
          Retourner à l&apos;accueil
        </Link>
      </Section>
    </Page>
  );
};

export default Page404;
