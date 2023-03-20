import Page from "@/components/Page/Page";
import { Box, Heading } from "@chakra-ui/react";
import Head from "next/head";
import { ReactNode } from "react";

export default function InscriptionWrapper({ children }: { children: ReactNode }) {
  return (
    <Page>
      <Head>
        <title>Inscription</title>
      </Head>
      <Box border="1px solid" borderColor="openbluefrance" maxWidth={600} mx="auto" p={12}>
        <Heading as="h2" fontSize="2xl" mb={[3, 6]}>
          Créer votre compte
        </Heading>
        {children}
      </Box>
    </Page>
  );
}
