import { Box, Center, Heading, HStack, Image, Spinner, Text } from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";
import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { _post } from "@/common/httpClient";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import { useQuery } from "@tanstack/react-query";
import { CONTACT_ADDRESS } from "@/common/constants/product";
import Page from "@/components/Page/Page";
import Head from "next/head";
import Link from "@/components/Links/Link";
import useToaster from "@/hooks/useToaster";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

function useActivation(activationToken: string) {
  const { data, isLoading, isError } = useQuery(["useActivation", activationToken], async () => {
    if (!activationToken) {
      throw new Error("Missing activation token");
    }
    return await _post("/api/v1/auth/activation", { activationToken });
  });

  return {
    isLoading,
    isError,
    account_status: data?.account_status,
  };
}

const ConfirmationPage = () => {
  const router = useRouter();
  const { toastSuccess } = useToaster();
  const { isLoading, isError, account_status } = useActivation(router.query.activationToken as string);

  useEffect(() => {
    if (account_status === "CONFIRMED") {
      toastSuccess("Votre compte a été validé.");
      router.push("/auth/connexion");
    }
  }, [account_status]);

  const title = "Confirmation de votre compte";
  return (
    <Page>
      <Head>
        <title>{title}</title>
      </Head>
      <Center
        mx="auto"
        maxWidth={1024}
        minH="40vh"
        flexDirection="column"
        border="1px solid"
        borderColor="openbluefrance"
        p={12}
      >
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
        {account_status === "PENDING_ADMIN_VALIDATION" && (
          <>
            <Image src="/images/attente_validation_compte.png" maxW={300} alt="Demande en cours d'étude" />
            <Heading as="h2" fontSize="2xl" my={[3, 6]}>
              Finalisation de votre inscription.
            </Heading>
            {/** FIXME gérer l'affichage de la validation par le gestionnaire de l'organisation également (si au moins un utilisateur confirmé) */}
            <Text textAlign="center">
              Votre demande est en cours d’étude par nos services.
              <br />
              Pour des raisons de sécurité, un de nos administrateurs va examiner votre demande.
              <br />
              Vous serez notifié par courriel dès que votre demande aura été validée (n’oubliez pas de vérifier vos
              spams).
            </Text>
          </>
        )}
        {account_status === "CONFIRMED" && (
          <>
            <Image src="/images/attente_validation_compte.png" maxW={300} alt="Demande en cours d'étude" />
            <Heading as="h2" fontSize="2xl" my={[3, 6]}>
              Finalisation de votre inscription.
            </Heading>
            <Text textAlign="center">Votre demande est a été validée.</Text>
          </>
        )}
        <HStack>
          <Link
            href="/"
            color="bluefrance"
            borderBottom="1px solid"
            mt={8}
            _hover={{ cursor: "pointer", textDecoration: "none", borderBottom: "2px solid" }}
          >
            <Box as="i" className="ri-arrow-left-line" marginRight="1w" />
            Retour à l’accueil
          </Link>
        </HStack>
      </Center>
    </Page>
  );
};

export default ConfirmationPage;
