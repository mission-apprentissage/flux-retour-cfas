import { CloseIcon } from "@chakra-ui/icons";
import { Box, Center, Heading, HStack, Image, Spinner, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import Head from "next/head";
import { useRouter } from "next/router";
import React, { useEffect } from "react";
import { SUPPORT_PAGE_ACCUEIL } from "shared";

import { _post } from "@/common/httpClient";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import Link from "@/components/Links/Link";
import Page from "@/components/Page/Page";
import useToaster from "@/hooks/useToaster";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

function useActivation(activationToken: string) {
  const { data, isLoading, isError } = useQuery<any, any>(["useActivation", activationToken], async () => {
    if (!activationToken) {
      throw new Error("Missing activation token");
    }
    return await _post("/api/v1/auth/activation", { activationToken });
  });

  return {
    isLoading,
    isError,
    account_status: data?.account_status,
    validationByGestionnaire: data?.validationByGestionnaire,
  };
}

const ConfirmationPage = () => {
  const router = useRouter();
  const { toastSuccess } = useToaster();
  const { isLoading, isError, account_status, validationByGestionnaire } = useActivation(
    router.query.activationToken as string
  );

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
              <a href={SUPPORT_PAGE_ACCUEIL} target="_blank" rel="noopener noreferrer">
                Contactez-nous
              </a>
            </Box>
          </>
        )}
        {account_status === "PENDING_ADMIN_VALIDATION" && (
          <>
            <Image src="/images/attente_validation_compte.png" maxW={300} alt="Demande en cours d'étude" />
            <Heading as="h2" fontSize="2xl" my={[3, 6]}>
              Votre compte est en attente de validation.
            </Heading>
            <Text textAlign="center">
              {validationByGestionnaire ? (
                <>
                  Votre demande est en cours d’étude par un gestionnaire de votre organisation.
                  <br />
                  Pour des raisons de sécurité, un des gestionnaires de votre organisation va examiner votre demande.
                </>
              ) : (
                <>
                  Votre demande est en cours d’étude par nos services.
                  <br />
                  Pour des raisons de sécurité, un de nos administrateurs va examiner votre demande.
                </>
              )}
              <br />
              Vous serez notifié(e) par email dès que votre demande aura été validée (n&apos;oubliez pas de vérifier vos
              courriers indésirables).
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
          <Link href="/" color="bluefrance" isUnderlined mt={8}>
            <Box as="i" className="ri-arrow-left-line" marginRight="1w" />
            Retour à l’accueil
          </Link>
        </HStack>
      </Center>
    </Page>
  );
};

export default ConfirmationPage;
