import React from "react";
import Head from "next/head";
import { Avatar, Box, Container, Heading, HStack, Text } from "@chakra-ui/react";
import { Page } from "../components";
import { Breadcrumb } from "../components/Breadcrumb/Breadcrumb";
import { getAuthServerSideProps } from "../common/SSR/getAuthServerSideProps";
import Table from "../components/Table/Table";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const data = [
  {
    firstName: "tanner",
    lastName: "linsley",
    age: 24,
    visits: 100,
    status: "In Relationship",
    progress: 50,
  },
  {
    firstName: "tandy",
    lastName: "miller",
    age: 40,
    visits: 40,
    status: "Single",
    progress: 80,
  },
  {
    firstName: "joe",
    lastName: "dirte",
    age: 45,
    visits: 20,
    status: "Complicated",
    progress: 10,
  },
];

const PrepTable = () => {
  const title = "Test Table";
  return (
    <Page>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Box w="100%" pt={[4, 8]} px={[1, 1, 6, 8]}>
        <Container maxW="xl">
          <Breadcrumb pages={[{ title: "Accueil", to: "/" }, { title: title }]} />
          <Heading textStyle="h2" color="grey.800" mt={5}>
            {title}
          </Heading>
          <Table
            data={data}
            columns={{
              firstName: {
                size: 100,
                header: () => <span>First Name</span>,
                cell: (item) => item.getValue(),
              },
              lastName: {
                size: 100,
                header: () => <span>Last Name</span>,
                cell: (item) => <i>{item.getValue()}</i>,
              },
              avatar: {
                size: 150,
                header: () => "Avatar",
                cell: ({ row }) => {
                  const { firstName, lastName } = data[row.id];
                  return (
                    <HStack>
                      <Avatar size="sm" name={`${firstName} ${lastName}`} />
                      <Text>{`${firstName} ${lastName}`}</Text>
                    </HStack>
                  );
                },
              },
              age: {
                size: 100,
                header: () => "Age",
                cell: (item) => item.renderValue(),
              },
              visits: {
                size: 100,
                header: () => <span>Visits</span>,
              },
              status: {
                size: 200,
                header: "Status",
              },
              progress: {
                size: 100,
                header: "Profile Progress",
                cell: (item) => item.renderValue(),
              },
            }}
            onRowClick={(rowId) => console.log(rowId)}
            mt={5}
          />
        </Container>
      </Box>
    </Page>
  );
};

export default PrepTable;
