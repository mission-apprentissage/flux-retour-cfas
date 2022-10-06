import { Box, Flex, Heading, HStack, Spacer } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { hasUserRoles, roles } from "../../../../common/auth/roles";
import { BreadcrumbNav, CfasFilter, Page, Section } from "../../../../common/components";
import CfaPanel from "../../../../common/components/CfasFilter/CfasPanel";
import { NAVIGATION_PAGES } from "../../../../common/constants/navigationPages";
import useAuth from "../../../../common/hooks/useAuth";
import useFetchCfaInfo from "../../../../common/hooks/useFetchCfaInfo";
import { useFiltersContext } from "../FiltersContext";
import SwitchViewButton from "../SwitchViewButton";
import OrganismeViewContent from "./OrganismeViewContent";
import CopyCfaPrivateLinkButton from "./sections/actions/CopyCfaPrivateLinkButton";

const IndicateursVueOrganismePage = ({ userLoggedAsReseau = false }) => {
  const filtersContext = useFiltersContext();

  const { data: infosCfa, loading, error } = useFetchCfaInfo(filtersContext?.state?.cfa?.uai_etablissement);
  const { auth } = useAuth();
  const isAdmin = hasUserRoles(auth, roles.administrator);

  const currentOrganisme = filtersContext.state.cfa;
  const displaySousEtablissementDetail = filtersContext.state?.sousEtablissement !== null;
  const organismeFilterLabel = userLoggedAsReseau
    ? `Sélectionner un organisme du réseau ${auth.network}`
    : "Sélectionner un organisme";

  return (
    <Page>
      <Section withShadow paddingY="3w">
        <BreadcrumbNav
          links={[NAVIGATION_PAGES.VisualiserLesIndicateurs, NAVIGATION_PAGES.VisualiserLesIndicateursParOrganisme]}
        />
        <HStack marginTop="4w" marginBottom="3v" spacing="2w">
          <Heading as="h1">{NAVIGATION_PAGES.VisualiserLesIndicateursParOrganisme.title}</Heading>
          <SwitchViewButton />
        </HStack>
        {currentOrganisme ? (
          <Flex>
            <CfasFilter
              filters={filtersContext.state}
              onCfaChange={filtersContext.setters.setCfa}
              defaultButtonLabel={organismeFilterLabel}
            />
            <Spacer />
            {/* Copie du lien privé si administrateur et pas dans la vue détail d'un sous établissement */}
            {infosCfa?.url_tdb && !displaySousEtablissementDetail && isAdmin && (
              <CopyCfaPrivateLinkButton link={infosCfa?.url_tdb} />
            )}
          </Flex>
        ) : (
          <Box marginY="3w" paddingX="8w" paddingY="6w" border="1px solid" borderColor="#E5E5E5">
            <CfaPanel filters={filtersContext.state} onCfaClick={filtersContext.setters.setCfa} value={null} />
          </Box>
        )}
      </Section>
      {Boolean(currentOrganisme) && (
        <OrganismeViewContent infosCfa={infosCfa} loading={loading} error={error} filters={filtersContext.state} />
      )}
    </Page>
  );
};

IndicateursVueOrganismePage.propTypes = {
  userLoggedAsReseau: PropTypes.bool,
};

export default IndicateursVueOrganismePage;
