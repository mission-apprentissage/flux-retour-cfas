import React from "react";
import { Avatar, Heading, HStack, Text } from "@chakra-ui/react";
import Table from "../../../components/Table/Table";
import { useOrganisme } from "../../../hooks/useOrganisme";
import { useEspace } from "../../../hooks/useEspace";

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

const EnqueteSIFA = () => {
  const { myOrganisme, isMonOrganismePages, isOrganismePages } = useEspace();
  const { organisme } = useOrganisme();

  // eslint-disable-next-line no-unused-vars
  const curentOrganisme = myOrganisme || organisme;

  return (
    <>
      <Heading textStyle="h2" color="grey.800" mt={5}>
        {isMonOrganismePages && `Mon Enquete SIFA2`}
        {isOrganismePages && `Son Enquete SIFA2`}
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
        // onRowClick={(rowId) => console.log(rowId)}
        mt={5}
      />
    </>
  );
};

export default EnqueteSIFA;
