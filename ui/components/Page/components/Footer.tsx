import { Box, Container, Flex, Image, List, ListItem, Text } from "@chakra-ui/react";
import { CRISP_FAQ } from "shared";

import Link from "@/components/Links/Link";

const APP_VERSION = process.env.NEXT_PUBLIC_VERSION;

const Footer = () => {
  return (
    <Box borderTop="1px solid" borderColor="bluefrance" color="#1E1E1E" fontSize="zeta" w="full">
      <Container maxW="xl" pt={["0", "0", "0", "2.5rem"]} pb={["4w", "4w", "2w", "2w"]}>
        <Flex flexDirection={{ base: "column", lg: "row" }} justifyContent="space-between" gap={8}>
          <Image
            src="/images/marianne.svg#svgView(viewBox(12 0 152 78))"
            alt="Logo République française"
            width="290"
            height="130"
            userSelect="none"
          />
          <Box maxW={{ lg: "588px" }} ml={{ lg: "auto" }} mt={{ base: 8, lg: 0 }}>
            <Image
              src="/images/numerique_gouv.png"
              alt="Un service proposé par numerique.gouv"
              width="192px"
              height="64px"
              display="block"
              ml={{ lg: "auto" }}
              mb={4}
              userSelect="none"
            />
            <Text>
              Mandatée par le Ministère du Travail, de l&apos;Emploi et de l&apos;Insertion, le Ministère de la
              Transformation et de la Fonction publiques, le Ministère de l&apos;Éducation Nationale, de la Jeunesse et
              des Sports, le Ministère de la Recherche, de l&apos;Enseignement Supérieur et de l&apos;Innovation, la
              Mission interministérielle pour l&apos;apprentissage développe plusieurs services destinés à faciliter les
              entrées en apprentissage.
            </Text>
            <List textStyle="sm" fontWeight="700" flexDirection="row" flexWrap="wrap" display="flex" mt={4}>
              <ListItem>
                <Link href="https://info.gouv.fr" mr={4} isExternal>
                  info.gouv.fr
                </Link>
              </ListItem>
              <ListItem>
                <Link href="https://www.service-public.fr/" mr={4} isExternal>
                  service-public.fr
                </Link>
              </ListItem>
              <ListItem>
                <Link href="https://www.legifrance.gouv.fr/" mr={4} isExternal>
                  legifrance.gouv.fr
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
                <Link href={"/sitemap.xml"}>Plan du site</Link>
              </ListItem>
              <ListItem _after={{ content: "'|'", marginLeft: "0.5rem", marginRight: "0.5rem" }}>
                <Link href={"/accessibilite"}>Accessibilité : non conforme</Link>
              </ListItem>
              <ListItem _after={{ content: "'|'", marginLeft: "0.5rem", marginRight: "0.5rem" }}>
                <Link href={"/mentions-legales"}>Mentions légales</Link>
              </ListItem>
              <ListItem _after={{ content: "'|'", marginLeft: "0.5rem", marginRight: "0.5rem" }}>
                <Link href={"/cgu"}>Conditions générales d’utilisation</Link>
              </ListItem>
              <ListItem _after={{ content: "'|'", marginLeft: "0.5rem", marginRight: "0.5rem" }}>
                <Link href="/stats">Statistiques</Link>
              </ListItem>
              <ListItem _after={{ content: "'|'", marginLeft: "0.5rem", marginRight: "0.5rem" }}>
                <Link target="_blank" rel="noopener noreferrer" href={CRISP_FAQ}>
                  Centre d’aide
                </Link>
              </ListItem>
              <ListItem _after={{ content: "'|'", marginLeft: "0.5rem", marginRight: "0.5rem" }}>
                <Link href={"/politique-de-confidentialite"}>Politique de confidentialité</Link>
              </ListItem>
              <ListItem _after={{ content: "'|'", marginLeft: "0.5rem", marginRight: "0.5rem" }}>
                <Link href="https://beta.gouv.fr/startups/tdb-apprentissage.html" isExternal>
                  À propos
                </Link>
              </ListItem>
              <ListItem _after={{ content: "'|'", marginLeft: "0.5rem", marginRight: "0.5rem" }}>
                <Link
                  href="https://www.notion.so/mission-apprentissage/Journal-des-volutions-5c9bec4ae3c3451da671f3f684ee994f"
                  isExternal
                >
                  Journal des évolutions
                </Link>
              </ListItem>
              <ListItem _after={{ content: "''", marginLeft: "0.5rem", marginRight: "0.5rem" }}>
                <Link href="https://github.com/mission-apprentissage/flux-retour-cfas" isExternal>
                  Code source
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
