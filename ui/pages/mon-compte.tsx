import { Box, Flex, Heading } from "@chakra-ui/react";
import Head from "next/head";
import React from "react";

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import Page from "@/components/Page/Page";
import ProfileInformation from "@/components/Profile/ProfileInformation";
import withAuth from "@/components/withAuth";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const ProfilePage = () => {
  return (
    <Page>
      <Head>
        <title>Mon compte</title>
      </Head>
      <Flex>
        <Box w="30%" pt={[4, 8]} color="#1E1E1E">
          <Box borderLeft="2px solid" _hover={{ cursor: "pointer" }} borderColor={"bluefrance"} color={"bluefrance"}>
            <Heading as="h2" fontSize="md" ml={3}>
              Mes informations
            </Heading>
          </Box>
        </Box>
        <Box w="100%" pt={[4, 8]} mb={5}>
          <ProfileInformation />
        </Box>
      </Flex>
    </Page>
  );
};

export default withAuth(ProfilePage);
