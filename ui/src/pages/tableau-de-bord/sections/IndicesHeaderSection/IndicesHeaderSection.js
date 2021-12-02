import { Box, Heading, HStack } from "@chakra-ui/react";
import React from "react";

import { hasUserRoles, roles } from "../../../../common/auth/roles";
import { Section } from "../../../../common/components";
import useAuth from "../../../../common/hooks/useAuth";
import { useFiltersContext } from "../../FiltersContext";
import CfasFilter from "./CfasFilter/CfasFilter";
import FormationFilter from "./FormationFilter/FormationFilter";
import TerritoireFilter from "./TerritoireFilter/TerritoireFilter";

const IndicesHeaderSection = () => {
  const filtersContext = useFiltersContext();
  const [auth] = useAuth();

  const displayReseauPanel = hasUserRoles(auth, [roles.administrator, roles.pilot]);

  return (
    <Section backgroundColor="galt" paddingY="4w" withShadow>
      <Heading as="h1" variant="h1" marginBottom="1w">
        Visualiser les indices en temps réel
      </Heading>
      <TerritoireFilter
        onDepartementChange={filtersContext.setters.setDepartement}
        onRegionChange={filtersContext.setters.setRegion}
        filters={filtersContext.state}
      />
      <HStack marginTop="3w">
        <CfasFilter
          filters={filtersContext.state}
          onCfaChange={filtersContext.setters.setCfa}
          onReseauChange={filtersContext.setters.setReseau}
          displayReseauPanel={displayReseauPanel}
        />
        <Box as="span" color="grey.800">
          ou
        </Box>
        <FormationFilter filters={filtersContext.state} onFormationChange={filtersContext.setters.setFormation} />
      </HStack>
    </Section>
  );
};
export default IndicesHeaderSection;
