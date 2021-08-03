import { Box, Table as ChakraTable, Text, Th, Thead, Tr } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { TableSkeleton } from "..";

const Table = ({ headers, loading, error, children }) => {
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
    <ChakraTable>
      <Thead>
        <Tr background="galt">
          {headers.map((header) => {
            return (
              <Th
                key={header}
                textTransform="initial"
                textColor="grey.800"
                fontSize="epsilon"
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

Table.propTypes = {
  headers: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
  children: PropTypes.node,
  loading: PropTypes.bool,
  error: PropTypes.object,
};

export default Table;
