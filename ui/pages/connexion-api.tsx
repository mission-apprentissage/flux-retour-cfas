import { ArrowForwardIcon } from "@chakra-ui/icons";
import { Box, Button, Center, Heading, HStack, Spinner, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import Head from "next/head";
import { useRouter } from "next/router";
import React, { useEffect } from "react";
import { IOrganisationType } from "shared";
import { useLocalStorage } from "usehooks-ts";
import { z } from "zod";

import { _post } from "@/common/httpClient";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import Page from "@/components/Page/Page";
import Ribbons from "@/components/Ribbons/Ribbons";
import { useOrganisme } from "@/hooks/organismes";
import useAuth from "@/hooks/useAuth";
import { useEffectifsOrganismeOrganisation } from "@/modules/mon-espace/effectifs/useEffectifsOrganisme";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const useFetchVerifyUser = (organismeId) => {
  const router = useRouter();
  const { data, isLoading, error } = useQuery<any, any>(["verify-user", organismeId], () =>
    _post(`/api/v1/organismes/${organismeId}/verify-user`, router.query)
  );

  return { data, loading: isLoading, error };
};

const ConnexionAPI = () => {
  const router = useRouter();
  const { organisme } = useEffectifsOrganismeOrganisation();
  const { organisme: currentOrganisme } = useOrganisme(organisme?._id);

  useEffect(() => {
    if (!router.query.api_key && !currentOrganisme?.api_key) {
      router.push(`/parametres?erpV3=${router.query.erp}`);
    }
  }, [currentOrganisme]);

  if (!router.query.api_key && !currentOrganisme?.api_key) {
    return <Spinner />;
  }

  return (
    <>{router.query.api_key && currentOrganisme ? <ConnexionAPIVerifyUser organisme={currentOrganisme} /> : <></>}</>
  );
};

const ConnexionAPIVerifyUser = ({ organisme }) => {
  const router = useRouter();
  const { data, loading, error } = useFetchVerifyUser(organisme?._id);

  useEffect(() => {
    async function run() {
      if (error?.statusCode === 403) {
        await _post("/api/v1/auth/logout");
        router.push("/");
      } else if (data?.message === "success") {
        window.location.href = `/parametres?erpV3=${router.query.erp}`;
      }
    }
    run();
  }, [error, data]);

  if (loading) {
    return <Spinner />;
  }

  if (error?.statusCode === 403) {
    return (
      <Box>
        <Text color="grey.800" fontSize="1.1rem" fontWeight="bold">
          Vous n’avez pas les droits pour accéder à cette page.
        </Text>
      </Box>
    );
  }

  // if (error?.statusCode === 409) {
  //   return (
  //     <Box>
  //       <Text color="grey.800" fontSize="1.1rem" fontWeight="bold">
  //         Différente configuration détectée entre votre ERP et votre compte.
  //         {error.messages.message.includes("Siret") && "(Siret différent)"}
  //         {error.messages.message.includes("UAI") && "(UAI différent)"}
  //       </Text>
  //     </Box>
  //   );
  // }

  return (
    <Box>
      <Spinner />
    </Box>
  );
};

const ConnexionAPIUserNotConnected = () => {
  const { auth } = useAuth();
  const router = useRouter();
  const [originConnexionUrl, setOriginConnexionUrl] = useLocalStorage("originConnexionUrl", "");

  useEffect(() => {
    if (originConnexionUrl !== window.location.href) {
      setOriginConnexionUrl(window.location.href);
    }
  }, [originConnexionUrl]);

  return (
    <Center flexDirection="column" border="1px solid" borderColor="openbluefrance" w="xl" mx={52} py={16} px={4}>
      {!auth && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/supportOutline.svg" alt="aide" />
          <Heading as="h2" fontSize="2em" my={[3, 6]} color="blue_cumulus_main">
            Bienvenue sur le tableau de bord
          </Heading>
          <Text textAlign="center">
            Veuillez vous connecter ou créer un compte pour accéder <br />
            au tableau de bord de l’apprentissage.
          </Text>
          <HStack mt={8} spacing={6}>
            <Button
              size="md"
              onClick={() => {
                router.push(`/auth/connexion`);
              }}
              variant="secondary"
            >
              Se connecter
            </Button>
            <Button
              size="md"
              onClick={() => {
                router.push(`/auth/inscription`);
              }}
              variant="link"
              borderBottomColor="bluefrance"
              borderBottomStyle="solid"
              borderBottomWidth={1.5}
              borderRadius={0}
              padding={"2px"}
              leftIcon={<ArrowForwardIcon />}
            >
              Créer un compte
            </Button>
          </HStack>
        </>
      )}
      {auth && auth.account_status !== "CONFIRMED" && (
        <Text color="grey.800" fontSize="1.1rem" fontWeight="bold">
          Votre compte est en cours de validation.
        </Text>
      )}
    </Center>
  );
};

const ConnexionAPIPage = () => {
  const ConnexionAPIContent = ({
    authorizedOrganisationTypes = [],
  }: {
    authorizedOrganisationTypes: IOrganisationType[];
  }) => {
    const router = useRouter();
    const { auth, organisationType } = useAuth();

    if (!auth || auth.account_status !== "CONFIRMED") {
      return <ConnexionAPIUserNotConnected />;
    }

    if (authorizedOrganisationTypes.length > 0 && !authorizedOrganisationTypes.includes(organisationType)) {
      return (
        <Text color="grey.800" fontSize="1.1rem" fontWeight="bold">
          Vous n’avez pas les droits pour accéder à cette page.
        </Text>
      );
    }

    const validation = z
      .strictObject({
        siret: z.string(),
        uai: z.string(),
        erp: z.string(),
        api_key: z.string().optional(),
      })
      .safeParse(router.query);

    // ?siret=XXXXX&uai=YYYYY&erp=ZZZZ&api_key=TTTTT
    if (!validation.success) {
      return (
        <Ribbons variant="alert" mt="0.5rem">
          <Text color="grey.800" fontSize="1.1rem" fontWeight="bold">
            Un problème de configuration a été détecté.
          </Text>
          <Text color="grey.800" mt={2} textStyle="sm">
            Merci d’envoyer un message à notre équipe de support à l’adresse tableau-de-bord@apprentissage.beta.gouv.fr
            <br />
          </Text>
        </Ribbons>
      );
    }

    return <ConnexionAPI />;
  };

  return (
    <Page>
      <Head>
        <title>Connexion ERP</title>
      </Head>

      <Center w="100%" pt={[4, 8]} mb={5}>
        <ConnexionAPIContent authorizedOrganisationTypes={["ORGANISME_FORMATION"]} />
      </Center>
    </Page>
  );
};

export default ConnexionAPIPage;
