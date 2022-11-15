import { Box, Flex, Heading, HStack, Text } from "@chakra-ui/react";
import React from "react";
import { NavLink } from "react-router-dom";
import { Page } from "../components/Page/Page";
import { Section } from "../components/Section/Section";
import ArrowLink from "../components/ArrowLink/ArrowLink";
import { NAVIGATION_PAGES } from "../common/constants/navigationPages";
import { PRODUCT_NAME } from "../common/constants/product";
import { CityHall, GraphsAndStatistics, School } from "../theme/components/icons";
import Head from "next/head";
export default function Home() {
  const title = PRODUCT_NAME;
  return (
    <Page>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Flex>
        <Box flex="1" alignSelf="center">
          <Heading as="h1" fontSize="40px">
            Le {title}
          </Heading>
          <Text fontSize="gamma" color="grey.800" marginTop="4w">
            Visualisez <strong>les effectifs d’apprentis en temps réel</strong>, au national et dans les territoires
          </Text>
        </Box>
      </Flex>
    </Page>
  );
}
