import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { Box, Button, Flex, Text } from "@chakra-ui/react";
import Head from "next/head";
import NavLink from "next/link";

import Page from "@/components/Page/Page";
import { Support } from "@/theme/components/icons"; // TODO wtf this is an image !

const RedirectionPage = () => {
  const router = useRouter();

  const [timeLeft, setTimeLeft] = useState(4);
  const intervalRef = useRef();

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  // Add a listener to `timeLeft`
  useEffect(() => {
    if (timeLeft <= 0) {
      clearInterval(intervalRef.current);
      router.push("/mon-espace/mon-organisme");
    }
  }, [router, timeLeft]);

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
            <Text>
              Cliquez sur le bouton “Accéder à mon Espace” si vous n’êtes pas redirigé dans les [{timeLeft}] secondes.
            </Text>
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
