import React from "react";
import { Box, Flex, Heading } from "@chakra-ui/react";
import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";
import Page from "@/components/Page/Page";
import Head from "next/head";
import withAuth from "@/components/withAuth";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import ProfileInformation from "@/components/Profile/ProfileInformation";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const ProfilePage = () => {
  const MyProfile = () => {
    return (
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
    );
  };

  return (
    <Page>
      <Head>
        <title>Mon compte</title>
      </Head>

      <Breadcrumb pages={[{ title: "Mon Compte", to: "/" }, { title: "Mon compte" }]} />
      <MyProfile />
    </Page>
  );
};

export default withAuth(ProfilePage);
