import { AspectRatio, Box, Container, Flex, Grid, GridItem, List, ListItem, Text } from "@chakra-ui/react";
import Image from "next/image";
import { CRISP_FAQ } from "shared";

import Link from "@/components/Links/Link";

const APP_VERSION = process.env.NEXT_PUBLIC_VERSION;

const GOVERNMENT_LINKS = [
  { href: "https://www.legifrance.gouv.fr/", label: "legifrance.gouv.fr", isExternal: true },
  { href: "https://www.gouvernement.fr/", label: "gouvernement.fr", isExternal: true },
  { href: "https://www.service-public.fr/", label: "service-public.fr", isExternal: true },
  { href: "https://www.data.gouv.fr/fr/", label: "data.gouv.fr", isExternal: true },
] as const;

const FOOTER_LINKS = [
  { href: "/sitemap.xml", label: "Plan du site" },
  { href: "/accessibilite", label: "Accessibilité : non conforme" },
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/cgu", label: "Conditions générales d’utilisation" },
  { href: "/stats", label: "Statistiques" },
  { href: CRISP_FAQ, label: "Centre d’aide" },
  { href: "/politique-de-confidentialite", label: "Politique de confidentialité" },
  { href: "https://beta.gouv.fr/startups/tdb-apprentissage.html", label: "À propos", isExternal: true },
  {
    href: "https://www.notion.so/mission-apprentissage/Journal-des-volutions-5c9bec4ae3c3451da671f3f684ee994f",
    label: "Journal des évolutions",
    isExternal: true,
  },
  { href: "https://github.com/mission-apprentissage/flux-retour-cfas", label: "Code source", isExternal: true },
] as const;

type LinkItem = {
  href: string;
  label: string;
  isExternal?: boolean;
};

interface RenderOptions {
  /** Add a trailing margin‑right to every item except the last */
  marginRight?: number | string;
  /** Insert a vertical bar separator between items */
  withSeparator?: boolean;
}

const renderLinks = (links: readonly LinkItem[], options: RenderOptions = {}) =>
  links.map((link, index) => {
    const isLast = index === links.length - 1;

    // Separator ("|") only when explicitly requested and not the last item
    const separatorProps =
      options.withSeparator && !isLast ? { content: "'|'", marginLeft: "0.5rem", marginRight: "0.5rem" } : undefined;

    // Trailing margin‑right for inline spacing (government links)
    const linkProps = !isLast && options.marginRight ? { mr: options.marginRight } : {};

    return (
      <ListItem key={link.href} _after={separatorProps}>
        <Link href={link.href} isExternal={link.isExternal} {...linkProps} display="inline-flex" alignItems="center">
          {link.label}
        </Link>
      </ListItem>
    );
  });

const Footer = () => {
  return (
    <Box borderTop="1px solid" borderColor="bluefrance" color="#1E1E1E" fontSize="zeta" w="full">
      <Container maxW="xl" pt={["0", "0", "0", "2.5rem"]} pb={["4w", "4w", "2w", "2w"]}>
        <Grid gap={{ base: 6, lg: 8 }} templateColumns={{ base: "1fr", lg: "repeat(4, 1fr)" }}>
          <GridItem colSpan={{ base: 1, lg: 1 }} mt={{ base: 4, lg: 0 }} display="flex" alignItems="center">
            <AspectRatio ratio={270 / 130} w={270}>
              <Image src="/images/marianne.svg" alt="Logo République française" fill priority objectFit="contain" />
            </AspectRatio>
          </GridItem>

          <GridItem
            colSpan={{ base: 1, lg: 1 }}
            pl={{ base: 0, lg: 4 }}
            height="100%"
            display="flex"
            alignItems="center"
          >
            <AspectRatio ratio={1 / 1} w={81}>
              <Image src="/images/france_relance.svg" alt="France relance" fill priority />
            </AspectRatio>
          </GridItem>

          <GridItem colSpan={{ base: 1, lg: 2 }}>
            <Box alignSelf="center" flex="1">
              <Text>
                Mandatée par plusieurs ministères, la{" "}
                <Link
                  href="https://beta.gouv.fr/startups/?incubateur=mission-apprentissage"
                  isExternal
                  isUnderlined
                  display="inline-flex"
                  alignItems="center"
                >
                  Mission interministérielle pour l’apprentissage
                </Link>{" "}
                développe plusieurs services destinés à faciliter les entrées en apprentissage.
              </Text>
              <br />
              <List textStyle="sm" fontWeight="700" flexDirection="row" flexWrap="wrap" mb={[3, 3, 0]} display="flex">
                {renderLinks(GOVERNMENT_LINKS, { marginRight: 4 })}
              </List>
            </Box>
          </GridItem>
        </Grid>
      </Container>

      <Box borderTop="1px solid" borderColor="#CECECE" color="#6A6A6A">
        <Container maxW="xl" py={[3, 3, 5]}>
          <Flex flexDirection={["column", "column", "row"]}>
            <List gap={1} textStyle="xs" flexDirection="row" flexWrap="wrap" display="flex" flex="1">
              {renderLinks(FOOTER_LINKS, { withSeparator: true })}
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
