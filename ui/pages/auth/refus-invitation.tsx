import { Button, Heading, Image, Text, VStack } from "@chakra-ui/react";
import Head from "next/head";
import { useRouter } from "next/router";
import React, { useEffect } from "react";

import { _post } from "@/common/httpClient";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import Page from "@/components/Page/Page";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const PageRefus = () => {
  const router = useRouter();

  // try to use the invitation token if provided
  useEffect(() => {
    if (router.query.invitationToken) {
      (async () => {
        try {
          await _post(`/api/v1/invitations/${router.query.invitationToken}/reject`);
        } catch (err) {
          // no error if token is missing
        }
      })();
    }
  }, []);

  return (
    <Page>
      <Head>
        <title>Refus d’invitation</title>
      </Head>
      <VStack gap={4} border="1px solid" borderColor="openbluefrance" maxWidth={600} mx="auto" p={12}>
        <Image src="/images/refus-invitation.svg" alt="Refus de l'invitation" />

        <Heading as="h2" fontSize="2xl">
          Vous ne donnez pas suite à l’invitation.
        </Heading>

        <Text align="center">
          La personne à l’origine de l’invitation sera informée par email.
          <br />
          Si vous changez d’avis, cliquez sur le bouton ci-dessous.
        </Text>

        <Button onClick={() => router.push("/auth/inscription")} variant="secondary">
          Créer mon compte
        </Button>
      </VStack>
    </Page>
  );
};

export default PageRefus;
