import { Box, Heading, Text } from "@chakra-ui/react";

import { NAVIGATION_PAGES } from "../../common/constants/navigationPages";
import { BreadcrumbNav, Page, Section } from "../../components";
import MentionsLegalesAccordions from "./MentionsLegalesAccordions";

// prettier-ignore
const MentionsLegales = () => {
  const dateUpdated = "28 juillet";
  return (
    <Page>
      <Section withShadow paddingTop="3w">
        <BreadcrumbNav links={[NAVIGATION_PAGES.Accueil, NAVIGATION_PAGES.MentionsLegales]} />
      </Section>
      <Section marginTop="5w">
        <Heading as="h1">{NAVIGATION_PAGES.MentionsLegales.title}</Heading>
        <Box fontSize="omega">
          <Text marginTop="4w" color="#929292">
            Mise à jour le : {dateUpdated}
          </Text>
          <Text marginTop="2w" color="#3A3A3A">
            Les mentions légales obligatoires concernant le Tableau de bord de l’apprentissage sont indiquées sur cette
            page conformément à la loi
            pour la confiance dans l&apos;économie numérique (LCEN) de juin 2004.
          </Text>
        </Box>
      </Section>
      <Section marginBottom="10w">
        <MentionsLegalesAccordions />
      </Section>
    </Page>
  );
};

export default MentionsLegales;
