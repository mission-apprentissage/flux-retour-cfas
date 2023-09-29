import { Box, Table as ChakraTable, Text, Th, Thead, Tr } from "@chakra-ui/react";
import React from "react";

import TableSkeleton from "@/components/skeletons/TableSkeleton";

const Table = ({
  headers,
  loading,
  error,
  children,
}: {
  headers: string[];
  loading?: boolean;
  error?: any;
  children: React.ReactNode;
}) => {
  if (loading) {
    return <TableSkeleton headers={headers} />;
  }

  if (error) {
    return (
      <Text fontSize="epsilon" color="grey.800">
        <Box as="i" className="ri-error-warning-fill" verticalAlign="middle" marginRight="1v" />
        <Box as="span" verticalAlign="middle">
          Erreur lors du chargement des données
        </Box>
      </Text>
    );
  }

  return (
    <ChakraTable position="relative">
      <Thead position="sticky" top="0" zIndex="1">
        <Tr background="galt">
          {headers.map((header) => {
            return (
              <Th
                key={header}
                textTransform="initial"
                textColor="grey.800"
                fontSize="zeta"
                fontWeight="700"
                paddingY="3w"
                letterSpacing="0px"
                borderBottom="2px solid"
                borderBottomColor="bluefrance"
              >
                {header}
              </Th>
            );
          })}
        </Tr>
      </Thead>
      {children}
    </ChakraTable>
  );
};

export default Table;
