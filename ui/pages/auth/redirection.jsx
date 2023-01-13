import { Box, Button, Flex, Text } from "@chakra-ui/react";
import Head from "next/head";
import { Page } from "../../components";
import { Support } from "../../theme/components/icons";
import NavLink from "next/link";
import { useRouter } from "next/router";

const RedirectionPage = () => {
  const router = useRouter();
  setTimeout(function () {
    router.push("/mon-espace/mon-organisme");
  }, 5000);
  return (
    <Page>
      <Head>
        <title>Redirection</title>
      </Head>
      <Flex mb="10rem" flexDirection="column" alignItems="center">
        <Box p="9w" w="50rem" border="1px solid" borderColor="#E3E3FD" textAlign="center">
          <Flex justifyContent="center">
            <Support />
          </Flex>
          <Box mx="9rem">
            <Text fontSize={28} fontWeight={700}>
              Heureux de vous revoir !
            </Text>
            <Text>Cliquez sur le bouton “Accéder à mon Espace” si vous n’êtes pas redirigé dans les [5] secondes.</Text>
            <Button as={NavLink} href="/mon-espace/mon-organisme" mt="4w" variant="secondary">
              Accéder à mon Espace
            </Button>
          </Box>
        </Box>
      </Flex>
    </Page>
  );
};

export default RedirectionPage;
