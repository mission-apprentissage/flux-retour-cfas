import React from "react";
import Head from "next/head";
import { Box, Container, Heading } from "@chakra-ui/react";
import { Page } from "../../components";
import { Breadcrumb } from "../../components/Breadcrumb/Breadcrumb";

import { getAuthServerSideProps } from "../../common/SSR/getAuthServerSideProps";
import Link from "../../components/Links/Link";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

export default function MesOrganismes() {
  const title = "Mes Organismes";
  return (
    <Page>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Box w="100%" pt={[4, 6]} px={[1, 1, 6, 8]}>
        <Container maxW="xl">
          <Breadcrumb pages={[{ title: "Mon espace", to: "/mon-espace/mon-organisme" }, { title: title }]} />
          <Heading textStyle="h2" color="grey.800" mt={5}>
            {title}
          </Heading>
          <ul>
            <li>
              <Link href="/mon-espace/organisme/637fa2398a3c0baeaf0a649a">OOF1 : Aden formation Caen </Link>
            </li>
          </ul>
        </Container>
      </Box>
    </Page>
  );
}
