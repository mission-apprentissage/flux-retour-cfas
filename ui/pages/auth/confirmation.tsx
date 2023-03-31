import { Box, Heading, HStack, Spinner } from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";
import React from "react";
import { useRouter } from "next/router";
import { _post } from "@/common/httpClient";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import { useQuery } from "@tanstack/react-query";
import { CONTACT_ADDRESS } from "@/common/constants/product";
import Page from "@/components/Page/Page";
import Head from "next/head";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

function useActivation(activationToken: string) {
  const { data, isLoading, isFetching, isError } = useQuery(["useActivation", activationToken], async () => {
    if (!activationToken) {
      throw new Error("Missing activation token");
    }
    return await _post("/api/v1/auth/activation", { activationToken });
  });

  return {
    isLoading,
    isFetching,
    isError,
  };
}

const ConfirmationPage = () => {
  const router = useRouter();
  // const email = activationToken ? decodeJWT(activationToken).sub : "";

  const { isLoading, isError } = useActivation(router.query.activationToken as string);
  if (router.query.activationToken && !isLoading && !isError) {
    console.log("ok, redirection sur finalisation");
    router.push("/auth/finalisation");
  }

  const title = "Confirmation de votre compte";
  return (
    <Page>
      <Head>
        <title>{title}</title>
      </Head>
      <Box border="1px solid" borderColor="openbluefrance" minH="40vh" maxWidth={600} mx="auto" p={12}>
        {isLoading && !isError && (
          <HStack>
            <Spinner mr={3} />
            <Heading as="h2" fontSize="2xl" mb={[3, 6]}>
              {title}
            </Heading>
          </HStack>
        )}
        {isError && (
          <>
            <HStack>
              <CloseIcon aria-hidden={true} color="error" mr={3} />
              <Heading fontSize="1rem" fontFamily="Marianne" fontWeight="500" marginBottom="2w" color="error">
                Le lien est expiré ou invalide, merci de prendre contact avec un administrateur en précisant votre
                adresse mail :
              </Heading>
            </HStack>
            <Box p={4}>
              <a href={`mailto:${CONTACT_ADDRESS}`}>{CONTACT_ADDRESS}</a>
            </Box>
          </>
        )}
      </Box>
    </Page>
  );
};

export default ConfirmationPage;
