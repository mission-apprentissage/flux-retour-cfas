import { Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";

import { CfdDetails } from "./CfdDetails";
import { RncpDetails } from "./RncpDetails";

type CertificationDetailsProps = {
  rncp_code: string | null;
  cfd_code: string | null;
};

export function CertificationDetails(props: CertificationDetailsProps) {
  return (
    <Tabs>
      <TabList>
        <Tab>RNCP</Tab>
        <Tab>CFD</Tab>
      </TabList>
      <TabPanels>
        <TabPanel>
          <RncpDetails code={props.rncp_code} />
        </TabPanel>
        <TabPanel>
          <CfdDetails code={props.cfd_code} />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}
