import { Box, Container, Flex, Heading, Text } from "@chakra-ui/react";

import { FAQ_PATH } from "@/common/constants/faq";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import Link from "@/components/Links/Link";
import SimplePage from "@/components/Page/SimplePage";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

export default function CentreDAidePage() {
  return (
    <SimplePage title="Tableau de bord de l’apprentissage">
      <Container maxW="xl" py="10" gap="16">
        <Flex gap={12} mx="auto">
          <Box flex="3">
            <Heading as="h1" color="#465F9D" fontSize="beta" fontWeight="700" mb={6}>
              Contactez notre équipe support
            </Heading>
            <p>
              Merci de prendre contact avec l’équipe du Tableau de bord de l’apprentissage. Afin que nous puissions vous
              répondre dans les meilleurs délais, veuillez indiquer vos coordonnées et sélectionner ci-dessous le sujet
              pour lequel vous souhaitez nous contacter.
            </p>
            <Link
              href={FAQ_PATH}
              textDecoration={"underline"}
              isExternal
              plausibleGoal="clic_sifa_faq"
              my={8}
              color="bluefrance"
            >
              <Box as="i" className="ri-arrow-right-line" />
              <Text>Avez-vous consulté notre FAQ ?</Text>
            </Link>
            <iframe
              title="Contact Form"
              src="https://plugins.crisp.chat/urn:crisp.im:contact-form:0/contact/6d61b7c2-9d92-48dd-b4b9-5c8317f44099"
              referrerPolicy="origin"
              sandbox="allow-forms allow-popups allow-scripts allow-same-origin"
              width="100%"
              height="600px"
            />
          </Box>
          <Box flex="1"></Box>
        </Flex>
      </Container>
    </SimplePage>
  );
}
