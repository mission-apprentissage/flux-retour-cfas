import { Heading, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import React from "react";

import { BreadcrumbNav, ContactSection, Footer, Header, Section } from "../../common/components";
import { navigationPages } from "../../common/constants/navigationPages";

const StatistiquesPage = () => {
  return (
    <>
      <Header />
      <Section backgroundColor="galt" paddingY="8w" withShadow>
        <Heading as="h1" variant="h1" marginBottom="1w">
          {navigationPages.Statistiques.title}
        </Heading>
      </Section>
      <Section paddingTop="3w">
        <BreadcrumbNav links={[navigationPages.Accueil, navigationPages.Statistiques]} />
      </Section>
      <Section paddingY="4w">
        <Tabs isLazy lazyBehavior="keepMounted">
          <TabList>
            <Tab>Visites</Tab>
            <Tab>Profils utilisateur</Tab>
            <Tab>Acquisition</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <iframe
                plausible-embed
                width="100%"
                height="1800px"
                src="https://plausible.io/share/cfas.apprentissage.beta.gouv.fr%2Ftableau-de-bord?auth=Cbkf2yaD7CW-rs_lkiyJ-&embed=true&theme=light&background=transparent” scrolling=“no” frameborder=“0” loading=“lazy” style=“width: 100%; min-width: 100%; height: 1600px;"
              ></iframe>
            </TabPanel>
            <TabPanel>
              <iframe
                src="https://cfas.apprentissage.beta.gouv.fr/metabase/public/dashboard/8af240fe-aaed-466e-a903-537b328a749f"
                width="100%"
                height="100%"
                allowtransparency
              ></iframe>
            </TabPanel>
            <TabPanel>
              <iframe
                src="https://cfas.apprentissage.beta.gouv.fr/metabase/public/dashboard/3725a628-f37b-4220-8e55-b63241835b13"
                width="100%"
                height="100%"
                allowtransparency
              ></iframe>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Section>
      <ContactSection />
      <Footer />
    </>
  );
};

export default StatistiquesPage;
