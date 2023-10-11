import { Box, Container, Flex, Grid, GridItem, Image, List, ListItem, Text } from "@chakra-ui/react";

import Link from "@/components/Links/Link";
import { ExternalLinkLine } from "@/theme/components/icons";

const APP_VERSION = process.env.NEXT_PUBLIC_VERSION;

const Footer = () => {
  return (
    <Box borderTop="1px solid" borderColor="bluefrance" color="#1E1E1E" fontSize="zeta" w="full">
      <Container maxW="xl" pt={["0", "0", "0", "2.5rem"]} pb={["4w", "4w", "2w", "2w"]}>
        <Grid templateColumns={{ base: "1fr", lg: "repeat(4, 1fr)" }}>
          <GridItem colSpan={{ base: 1, lg: 1 }}>
            <Image
              src="/images/marianne.svg#svgView(viewBox(12 0 152 78))"
              alt="Logo République française"
              width="290"
              height="130"
              userSelect="none"
            />
          </GridItem>
          <GridItem
            colSpan={{ base: 1, lg: 1 }}
            pl={{ base: 0, lg: 4 }}
            height="100%"
            display="flex"
            alignItems="center"
          >
            <Image src="/images/france_relance.svg" alt="France relance" width="81" height="81" userSelect="none" />
          </GridItem>
          <GridItem colSpan={{ base: 1, lg: 2 }} mt={{ base: 8, lg: 0 }}>
            <Box alignSelf="center" flex="1">
              <Text>
                Mandatée par plusieurs ministères, la{" "}
                <Link
                  href={"https://beta.gouv.fr/startups/?incubateur=mission-apprentissage"}
                  textDecoration={"underline"}
                  isExternal
                >
                  Mission interministérielle pour l&apos;apprentissage
                </Link>{" "}
                développe plusieurs services destinés à faciliter les entrées en apprentissage.
              </Text>
              <br />
              <List
                textStyle="sm"
                fontWeight="700"
                flexDirection={"row"}
                flexWrap={"wrap"}
                mb={[3, 3, 0]}
                display="flex"
              >
                <ListItem>
                  <Link href="https://www.legifrance.gouv.fr/" mr={4} isExternal>
                    legifrance.gouv.fr
                  </Link>
                </ListItem>
                <ListItem>
                  <Link href="https://www.gouvernement.fr/" mr={4} isExternal>
                    gouvernement.fr
                  </Link>
                </ListItem>
                <ListItem>
                  <Link href="https://www.service-public.fr/" mr={4} isExternal>
                    service-public.fr
                  </Link>
                </ListItem>
                <ListItem>
                  <Link href="https://www.data.gouv.fr/fr/" isExternal>
                    data.gouv.fr
                  </Link>
                </ListItem>
              </List>
            </Box>
          </GridItem>
        </Grid>
      </Container>
      <Box borderTop="1px solid" borderColor="#CECECE" color="#6A6A6A">
        <Container maxW="xl" py={[3, 3, 5]}>
          <Flex flexDirection={["column", "column", "row"]}>
            <List
              textStyle="xs"
              flexDirection={"row"}
              flexWrap={"wrap"}
              display="flex"
              flex="1"
              // css={{ "li:not(:last-child):after": { content: "'|'", marginLeft: "0.5rem", marginRight: "0.5rem" } }}
            >
              <ListItem _after={{ content: "'|'", marginLeft: "0.5rem", marginRight: "0.5rem" }}>
                <Link href={"/sitemap.xml"}>Plan du site</Link>
              </ListItem>
              <ListItem _after={{ content: "'|'", marginLeft: "0.5rem", marginRight: "0.5rem" }}>
                <Link href={"/accessibilite"}>Accessibilité : Non conforme</Link>
              </ListItem>
              <ListItem _after={{ content: "'|'", marginLeft: "0.5rem", marginRight: "0.5rem" }}>
                <Link href={"/mentions-legales"}>Mentions légales</Link>
              </ListItem>
              <ListItem _after={{ content: "'|'", marginLeft: "0.5rem", marginRight: "0.5rem" }}>
                <Link href={"/cgu"}>Conditions générales d&apos;utilisation</Link>
              </ListItem>
              <ListItem _after={{ content: "'|'", marginLeft: "0.5rem", marginRight: "0.5rem" }}>
                <Link href="/stats" plausibleGoal="clic_statistiques">
                  Statistiques
                </Link>
              </ListItem>
              <ListItem _after={{ content: "'|'", marginLeft: "0.5rem", marginRight: "0.5rem" }}>
                <Link
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://mission-apprentissage.notion.site/Page-d-Aide-FAQ-dbb1eddc954441eaa0ba7f5c6404bdc0"
                >
                  Page d&rsquo;aide
                </Link>
              </ListItem>
              <ListItem _after={{ content: "'|'", marginLeft: "0.5rem", marginRight: "0.5rem" }}>
                <Link href={"/mentions-legales#protection-des-donnees"}>Protection des données</Link>
              </ListItem>
              <ListItem _after={{ content: "'|'", marginLeft: "0.5rem", marginRight: "0.5rem" }}>
                <Link href="https://beta.gouv.fr/startups/tdb-apprentissage.html" isExternal>
                  À propos
                  <ExternalLinkLine w={"0.55rem"} h={"0.55rem"} mb={"0.125rem"} ml={1} />
                </Link>
              </ListItem>
              <ListItem _after={{ content: "'|'", marginLeft: "0.5rem", marginRight: "0.5rem" }}>
                <Link
                  href="https://mission-apprentissage.notion.site/Journal-des-volutions-6de190f453e6455eb0804a911646d1df"
                  isExternal
                >
                  Journal des évolutions
                  <ExternalLinkLine w={"0.55rem"} h={"0.55rem"} mb={"0.125rem"} ml={1} />
                </Link>
              </ListItem>
              <ListItem _after={{ content: "''", marginLeft: "0.5rem", marginRight: "0.5rem" }}>
                <Link href="https://github.com/mission-apprentissage/flux-retour-cfas" isExternal>
                  Code source
                  <ExternalLinkLine w={"0.55rem"} h={"0.55rem"} mb={"0.125rem"} ml={1} />
                </Link>
              </ListItem>
            </List>
            <Text textStyle="xs" mt={[2, 2, 0]}>
              {APP_VERSION && `v.${APP_VERSION} `}© République française {new Date().getFullYear()}
            </Text>
          </Flex>
        </Container>
      </Box>
    </Box>
  );
};

export default Footer;
