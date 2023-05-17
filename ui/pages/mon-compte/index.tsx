import { Box, Flex } from "@chakra-ui/react";
import Head from "next/head";
import React from "react";

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import Page from "@/components/Page/Page";
import withAuth from "@/components/withAuth";
import NavigationCompte from "@/modules/mon-compte/NavigationCompte";
import ProfileInformation from "@/modules/mon-compte/ProfileInformation";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const ProfilePage = () => {
  return (
    <Page>
      <Head>
        <title>Mon compte</title>
      </Head>
      <Flex>
        <NavigationCompte />
        <Box w="100%" pt={[4, 8]} mb={5}>
          <ProfileInformation />
        </Box>
      </Flex>
    </Page>
  );
};

export default withAuth(ProfilePage);
