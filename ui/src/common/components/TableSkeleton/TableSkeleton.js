import { Skeleton, Table, Tbody, Td, Th, Thead, Tr } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

const TableSkeleton = ({ headers, numberOfLines = 5 }) => {
  return (
    <Table mt="2w">
      <Thead>
        <Tr background="gray.alt">
          {headers.map((header) => {
            return (
              <Th
                textTransform="initial"
                textColor="grey.800"
                backgroundColor="galt"
                fontSize="epsilon"
                fontWeight="700"
                paddingY="3w"
                letterSpacing="0px"
                borderBottom="2px solid"
                borderBottomColor="bluefrance"
                key={header}
              >
                {header}
              </Th>
            );
          })}
        </Tr>
      </Thead>
      <Tbody>
        {Array.from({ length: numberOfLines }, (_, i) => i).map((i) => {
          return (
            <Tr textAlign="left" key={i}>
              {headers.map((j) => {
                return (
                  <Td key={j}>
                    <Skeleton width="100%" height="1.5rem" />
                  </Td>
                );
              })}
            </Tr>
          );
        })}
      </Tbody>
    </Table>
  );
};

TableSkeleton.propTypes = {
  headers: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
  numberOfLines: PropTypes.number,
};

export default TableSkeleton;
