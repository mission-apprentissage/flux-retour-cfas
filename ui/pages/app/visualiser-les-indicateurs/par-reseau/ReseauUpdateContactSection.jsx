import { Link, Text } from "@chakra-ui/react";
import React from "react";

import { CONTACT_ADDRESS } from "../../../../common/constants/product";
import { Section } from "../../../../components";

const ReseauUpdateContactSection = () => {
  return (
    <Section borderTop="solid 1px" borderTopColor="grey.300" backgroundColor="galt" paddingY="2w">
      <Text marginRight="2px" color="grey.800">
        Pour apporter des modifications à votre réseau,&nbsp;
        <Link href={`mailto:${CONTACT_ADDRESS}`} color="bluefrance">
          contactez-nous.
        </Link>
      </Text>
    </Section>
  );
};

export default ReseauUpdateContactSection;
