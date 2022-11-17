import React from "react";
import { Box, Link, Text } from "@chakra-ui/react";
import { ExternalLinkLine } from "../../theme/components/icons";

const Cookies = () => {
  return (
    <Box pt={4} pb={16}>
      <Text>
        Pour les utilisateurs connectés, ce site dépose un petit fichier texte (un « cookie ») sur votre ordinateur pour
        vous authentifier et garder votre session active.
        <br />
        Cela nous permet de vous laisser connecté même si vous consultez le site dans un nouvel onglet, et de vous
        éviter de vous reconnecter à chaque fois que vous visitez le site.
        <br />
        <br />
        Ce site n&apos;affiche pas de bannière de consentement aux cookies car les cookies d&apos;authentification en
        sont exemptés, cf.{" "}
        <Link
          href={"https://www.cnil.fr/fr/cookies-et-traceurs-que-dit-la-loi"}
          textDecoration={"underline"}
          isExternal
        >
          https://www.cnil.fr/fr/cookies-et-traceurs-que-dit-la-loi{" "}
          <ExternalLinkLine w={"0.75rem"} h={"0.75rem"} mb={"0.125rem"} />
        </Link>
        .
      </Text>
    </Box>
  );
};

export default Cookies;
