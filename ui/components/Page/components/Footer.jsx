import React from "react";
import { Box, Container, Flex, List, ListItem, Text } from "@chakra-ui/react";
import { ExternalLinkLine } from "../../../theme/components/icons";
import LogoFooter from "./LogoFooter";
import Link from "../../Links/Link";

const APP_VERSION = process.env.NEXT_PUBLIC_VERSION;

const Footer = () => {
  return (
    <Box borderTop="1px solid" borderColor="bluefrance" color="#1E1E1E" fontSize="zeta" w="full">
      <Container maxW="xl" my={"-2.5rem"}>
        <Flex flexDirection={["column", "column", "row"]}>
          <Link href="/" w={["100%", "100%", "50%"]}>
            <LogoFooter size={"xl"} />
          </Link>

          <Box alignSelf="center" flex="1">
            <Text>
              Mandatée par le Ministère du Travail, de l&apos;Emploi et de l&apos;Insertion, le Ministère de la
              Transformation et de la Fonction publiques, le Ministère de l&apos;sEducation Nationale, de la Jeunesse et
              des Sports, le Ministère de la Recherche, de l&apos;Enseignement Supérieur et de l&apos;Innovation, la{" "}
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
            <List textStyle="sm" fontWeight="700" flexDirection={"row"} flexWrap={"wrap"} mb={[3, 3, 0]} display="flex">
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
        </Flex>
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
                <Link href={`/sitemap.xml`}>Plan du site</Link>
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
                <Link href={"/donnees-personnelles"}>Données personnelles</Link>
              </ListItem>
              <ListItem _after={{ content: "'|'", marginLeft: "0.5rem", marginRight: "0.5rem" }}>
                <Link href={"/cookies"}>Gestion des cookies</Link>
              </ListItem>
              <ListItem _after={{ content: "'|'", marginLeft: "0.5rem", marginRight: "0.5rem" }}>
                <Link href={"/stats"}>Statistiques</Link>
              </ListItem>
              <ListItem _after={{ content: "'|'", marginLeft: "0.5rem", marginRight: "0.5rem" }}>
                <Link href={"/assistance"}>Assistance</Link>
              </ListItem>
              <ListItem _after={{ content: "'|'", marginLeft: "0.5rem", marginRight: "0.5rem" }}>
                <Link
                  href="https://mission-apprentissage.notion.site/Documentation-32235dc713c04bbf9b44e6963e02c07e"
                  isExternal
                >
                  Documentation
                  <ExternalLinkLine w={"0.55rem"} h={"0.55rem"} mb={"0.125rem"} ml={1} />
                </Link>
              </ListItem>
              <ListItem _after={{ content: "'|'", marginLeft: "0.5rem", marginRight: "0.5rem" }}>
                <Link href="https://github.com/mission-apprentissage/cerfa/releases" isExternal>
                  Journal des versions
                  <ExternalLinkLine w={"0.55rem"} h={"0.55rem"} mb={"0.125rem"} ml={1} />
                </Link>
              </ListItem>
              <ListItem _after={{ content: "''", marginLeft: "0.5rem", marginRight: "0.5rem" }}>
                <Link href="https://github.com/mission-apprentissage/cerfa" isExternal>
                  Code source
                  <ExternalLinkLine w={"0.55rem"} h={"0.55rem"} mb={"0.125rem"} ml={1} />
                </Link>
              </ListItem>
            </List>
            <Text textStyle="xs" mt={[2, 2, 0]}>
              {APP_VERSION && `v.${APP_VERSION} `}© République française 2022
            </Text>
          </Flex>
        </Container>
      </Box>
    </Box>
  );
};

export default Footer;
